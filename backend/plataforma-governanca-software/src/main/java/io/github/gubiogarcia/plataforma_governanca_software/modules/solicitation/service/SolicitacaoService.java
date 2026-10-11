package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Evento;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusEvento;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.EventoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.EventoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.Solicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.CriarSolicitacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.SolicitacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.repository.SolicitacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Solicitações de stakeholders (Passo 5 do doc de autorização / D12).
 *
 * Regras de estado (não são RBAC, valem depois da permissão):
 * alteração e reprovação só para requisito APROVADO; aprovação só para requisito
 * ainda não aprovado; uma solicitação pendente igual por solicitante.
 * Atender/recusar registra a decisão; no tipo EVENTO também muda o status do evento,
 * e nas exportações libera o download para o solicitante.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SolicitacaoService {

    private static final String STATUS_APROVADO = "APROVADO";

    private final SolicitacaoRepository solicitacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final RequisitoRepository requisitoRepository;
    private final EventoRepository eventoRepository;
    private final EventoService eventoService;
    private final UsuarioRepository usuarioRepository;
    private final AutorizacaoService autorizacao;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public SolicitacaoResponseDTO criar(UUID projetoId, CriarSolicitacaoRequestDTO request) {
        Projeto projeto = carregarProjeto(projetoId);
        TipoSolicitacao tipo = request.tipo();
        autorizacao.exigir(projeto, tipo.permissaoParaSolicitar());
        Usuario solicitante = usuarioAtual();

        UUID alvoId = null;
        if (tipo.sobreRequisito()) {
            Requisito requisito = requisitoDoProjeto(request.alvoId(), projeto);
            boolean aprovado = requisito.getStatus() != null
                    && STATUS_APROVADO.equalsIgnoreCase(requisito.getStatus().getNome());
            if (tipo == TipoSolicitacao.APROVACAO_REQUISITO && aprovado) {
                throw new SolicitacaoInvalidaException("O requisito já está aprovado.");
            }
            if (tipo != TipoSolicitacao.APROVACAO_REQUISITO && !aprovado) {
                throw new SolicitacaoInvalidaException("Só é possível solicitar alteração ou reprovação de requisito APROVADO.");
            }
            alvoId = requisito.getId();
        } else if (tipo == TipoSolicitacao.EVENTO) {
            if (request.evento() == null) {
                throw new SolicitacaoInvalidaException("Informe os dados do evento solicitado.");
            }
            Evento evento = eventoService.criarSolicitado(solicitante, projeto, request.evento().nome(),
                    request.evento().descricao(), request.evento().dataHoraInicio(), request.evento().dataHoraFim());
            alvoId = evento.getId();
        }

        garantirSemPendenteIgual(projeto, tipo, alvoId, solicitante);

        Solicitacao solicitacao = solicitacaoRepository.save(Solicitacao.builder()
                .projeto(projeto)
                .tipo(tipo)
                .alvoId(alvoId)
                .status(StatusSolicitacao.PENDENTE)
                .solicitante(solicitante)
                .justificativa(request.justificativa())
                .dataCriacao(Instant.now())
                .build());
        log.info("Solicitação {} ({}) criada no projeto {} por {}.", solicitacao.getId(), tipo, projetoId, solicitante.getId());
        return mapear(solicitacao);
    }

    // ── Listar ────────────────────────────────────────────────────────────────

    /** Quem responde vê todas as solicitações do projeto; os demais, só as próprias. */
    @Transactional(readOnly = true)
    public List<SolicitacaoResponseDTO> listar(UUID projetoId, StatusSolicitacao status) {
        Projeto projeto = carregarProjeto(projetoId);
        autorizacao.exigirParticipacao(projeto);

        List<Solicitacao> solicitacoes = autorizacao.pode(projeto, Permissao.SOLICITACAO_RESPONDER)
                ? solicitacaoRepository.findAllByProjetoIdOrderByDataCriacaoDesc(projetoId)
                : solicitacaoRepository.findAllByProjetoIdAndSolicitanteIdOrderByDataCriacaoDesc(projetoId, usuarioAtual().getId());
        return solicitacoes.stream()
                .filter(s -> status == null || s.getStatus() == status)
                .map(this::mapear)
                .toList();
    }

    // ── Responder ─────────────────────────────────────────────────────────────

    @Transactional
    public SolicitacaoResponseDTO atender(UUID id, String resposta) {
        return responder(id, resposta, StatusSolicitacao.ATENDIDA);
    }

    @Transactional
    public SolicitacaoResponseDTO recusar(UUID id, String resposta) {
        return responder(id, resposta, StatusSolicitacao.RECUSADA);
    }

    private SolicitacaoResponseDTO responder(UUID id, String resposta, StatusSolicitacao decisao) {
        Solicitacao solicitacao = carregar(id);
        autorizacao.exigir(solicitacao.getProjeto(), Permissao.SOLICITACAO_RESPONDER);
        if (solicitacao.getTipo() == TipoSolicitacao.EVENTO) {
            autorizacao.exigir(solicitacao.getProjeto(), Permissao.EVENTO_APPROVE);
        }
        exigirPendente(solicitacao);
        Usuario responsavel = usuarioAtual();

        if (solicitacao.getTipo() == TipoSolicitacao.EVENTO && solicitacao.getAlvoId() != null) {
            eventoService.definirStatus(solicitacao.getAlvoId(),
                    decisao == StatusSolicitacao.ATENDIDA ? StatusEvento.APROVADO : StatusEvento.REJEITADO, responsavel);
        }

        solicitacao.setStatus(decisao);
        solicitacao.setResposta(resposta);
        solicitacao.setRespondidoPor(responsavel);
        solicitacao.setDataResposta(Instant.now());
        log.info("Solicitação {} {} por {}.", id, decisao, responsavel.getId());
        return mapear(solicitacaoRepository.save(solicitacao));
    }

    /** Só o próprio solicitante, enquanto pendente. Evento pedido é descartado. */
    @Transactional
    public SolicitacaoResponseDTO cancelar(UUID id) {
        Solicitacao solicitacao = carregar(id);
        Usuario usuario = usuarioAtual();
        if (!solicitacao.getSolicitante().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException("Só quem fez a solicitação pode cancelá-la.");
        }
        exigirPendente(solicitacao);

        solicitacao.setStatus(StatusSolicitacao.CANCELADA);
        solicitacao.setDataResposta(Instant.now());
        Solicitacao salva = solicitacaoRepository.save(solicitacao);
        if (solicitacao.getTipo() == TipoSolicitacao.EVENTO && solicitacao.getAlvoId() != null) {
            eventoService.excluirSolicitado(solicitacao.getAlvoId());
        }
        return mapear(salva);
    }

    // ── Exportação liberada ───────────────────────────────────────────────────

    /** true se o usuário atual tem uma solicitação de exportação ATENDIDA neste projeto. */
    @Transactional(readOnly = true)
    public boolean exportacaoLiberada(Projeto projeto, TipoSolicitacao tipo) {
        UUID usuarioId = usuarioAtual().getId();
        return solicitacaoRepository.findAllByProjetoIdAndSolicitanteIdOrderByDataCriacaoDesc(projeto.getId(), usuarioId)
                .stream()
                .anyMatch(s -> s.getTipo() == tipo && s.getStatus() == StatusSolicitacao.ATENDIDA);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void garantirSemPendenteIgual(Projeto projeto, TipoSolicitacao tipo, UUID alvoId, Usuario solicitante) {
        // Evento sempre gera um alvo novo; os demais tipos não podem repetir enquanto pendentes
        if (tipo == TipoSolicitacao.EVENTO) return;
        boolean existe = alvoId != null
                ? solicitacaoRepository.existsByProjetoIdAndTipoAndAlvoIdAndSolicitanteIdAndStatus(
                        projeto.getId(), tipo, alvoId, solicitante.getId(), StatusSolicitacao.PENDENTE)
                : solicitacaoRepository.existsByProjetoIdAndTipoAndAlvoIdIsNullAndSolicitanteIdAndStatus(
                        projeto.getId(), tipo, solicitante.getId(), StatusSolicitacao.PENDENTE);
        if (existe) {
            throw new SolicitacaoDuplicadaException("Você já tem uma solicitação pendente igual a esta.");
        }
    }

    private Requisito requisitoDoProjeto(UUID requisitoId, Projeto projeto) {
        if (requisitoId == null) {
            throw new SolicitacaoInvalidaException("Informe o requisito (alvoId).");
        }
        Requisito requisito = requisitoRepository.findById(requisitoId)
                .orElseThrow(() -> new SolicitacaoNaoEncontradaException("Requisito não encontrado: " + requisitoId));
        if (!requisito.getProjeto().getId().equals(projeto.getId())) {
            throw new SolicitacaoInvalidaException("O requisito não pertence a este projeto.");
        }
        return requisito;
    }

    private void exigirPendente(Solicitacao solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.PENDENTE) {
            throw new SolicitacaoInvalidaException("A solicitação não está mais pendente (" + solicitacao.getStatus() + ").");
        }
    }

    private Projeto carregarProjeto(UUID id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new SolicitacaoNaoEncontradaException("Projeto não encontrado: " + id));
    }

    private Solicitacao carregar(UUID id) {
        return solicitacaoRepository.findById(id)
                .orElseThrow(() -> new SolicitacaoNaoEncontradaException("Solicitação não encontrada: " + id));
    }

    private Usuario usuarioAtual() {
        return usuarioRepository.findByExternalIdentityId(autorizacao.keycloakIdAtual())
                .orElseThrow(() -> new AcessoNegadoException("Usuário autenticado não encontrado na plataforma."));
    }

    private SolicitacaoResponseDTO mapear(Solicitacao s) {
        return new SolicitacaoResponseDTO(
                s.getId(), s.getProjeto().getId(), s.getTipo(), s.getAlvoId(), descreverAlvo(s),
                s.getStatus(), s.getSolicitante().getId(), s.getSolicitante().getNome(), s.getJustificativa(),
                s.getRespondidoPor() != null ? s.getRespondidoPor().getNome() : null,
                s.getResposta(), s.getDataCriacao(), s.getDataResposta());
    }

    private String descreverAlvo(Solicitacao s) {
        if (s.getAlvoId() == null) return null;
        if (s.getTipo().sobreRequisito()) {
            return requisitoRepository.findById(s.getAlvoId())
                    .map(r -> r.getCodigo() + " — " + r.getTitulo()).orElse(null);
        }
        if (s.getTipo() == TipoSolicitacao.EVENTO) {
            return eventoRepository.findById(s.getAlvoId()).map(Evento::getNome).orElse(null);
        }
        return null;
    }

    // Exceções de domínio

    public static class SolicitacaoNaoEncontradaException extends RuntimeException {
        public SolicitacaoNaoEncontradaException(String message) { super(message); }
    }

    public static class SolicitacaoInvalidaException extends RuntimeException {
        public SolicitacaoInvalidaException(String message) { super(message); }
    }

    public static class SolicitacaoDuplicadaException extends RuntimeException {
        public SolicitacaoDuplicadaException(String message) { super(message); }
    }
}
