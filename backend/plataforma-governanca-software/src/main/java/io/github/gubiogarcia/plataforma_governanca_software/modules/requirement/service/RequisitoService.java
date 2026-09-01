package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository.VinculoRequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Prioridade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.RequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.PrioridadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequisitoService {

    private final RequisitoRepository requisitoRepository;
    private final ProjetoRepository projetoRepository;
    private final StatusRequisitoRepository statusRequisitoRepository;
    private final PrioridadeRepository prioridadeRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;
    private final VinculoRequisitoRepository vinculoRequisitoRepository;
    private final ImpactoDadosRepository impactoDadosRepository;

    @Transactional
    public RequisitoResponseDTO criar(Jwt jwt, UUID projetoId, CriarRequisitoRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));

        StatusRequisito status;
        if (request.statusId() != null) {
            status = statusRequisitoRepository.findById(request.statusId())
                    .orElseThrow(() -> new StatusRequisitoService.StatusRequisitoNaoEncontradoException(request.statusId()));
        } else {
            status = statusRequisitoRepository.findAll().stream()
                    .min((a, b) -> Integer.compare(a.getOrdem(), b.getOrdem()))
                    .orElseThrow(() -> new RuntimeException("Nenhum status de requisito cadastrado."));
        }

        Prioridade prioridade = null;
        if (request.prioridadeId() != null) {
            prioridade = prioridadeRepository.findById(request.prioridadeId())
                    .orElseThrow(() -> new PrioridadeNaoEncontradaException(request.prioridadeId()));
        }

        // Gera o código sequencial único e imutável por projeto (REQ-001, REQ-002, ...)
        // Busca o maior número já usado para evitar duplicatas após inativações de requisitos
        long maxSequencial = requisitoRepository.findMaxSequencialByProjetoId(projetoId);
        String codigo = String.format("REQ-%03d", maxSequencial + 1);

        Requisito requisito = Requisito.builder()
                .projeto(projeto)
                .codigo(codigo)
                .titulo(request.titulo())
                .descricao(request.descricao())
                .tipoRequisito(request.tipoRequisito())
                .status(status)
                .prioridade(prioridade)
                .versao(1)
                .criadoPor(usuario)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        requisito = requisitoRepository.save(requisito);
        log.info("Requisito '{}' criado no projeto {} com código {}.", requisito.getTitulo(), projetoId, codigo);

        // ── Auditoria: criação do requisito ──────────────────────────────
        auditoriaService.registrar(
                usuario, null, projeto,
                "REQUISITO", requisito.getId(), AcaoAuditoria.CRIACAO,
                "titulo", null, requisito.getTitulo()
        );

        interacaoService.registrar(usuario, projeto, ModuloInteracao.REQUISITO, TipoInteracao.CRIACAO, requisito.getId(), "Requisito criado: " + requisito.getTitulo());
        return mapToResponseDTO(requisito);
    }

    @Transactional(readOnly = true)
    public List<RequisitoResponseDTO> listarPorProjeto(UUID projetoId) {
        return requisitoRepository.findAllByProjetoId(projetoId).stream()
                .filter(r -> Boolean.TRUE.equals(r.getAtivo()))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public RequisitoResponseDTO buscarPorId(UUID id) {
        Requisito requisito = requisitoRepository.findById(id)
                .orElseThrow(() -> new RequisitoNaoEncontradoException(id));
        return mapToResponseDTO(requisito);
    }

    @Transactional
    public RequisitoResponseDTO atualizar(Jwt jwt, UUID id, AtualizarRequisitoRequestDTO request) {
        Requisito requisito = requisitoRepository.findById(id)
                .orElseThrow(() -> new RequisitoNaoEncontradoException(id));

        Usuario usuario = resolverUsuario(jwt);

        // ── Registra auditoria campo a campo ──────────────────────────────
        if (request.titulo() != null && !request.titulo().equals(requisito.getTitulo())) {
            auditoriaService.registrar(
                    usuario, null, requisito.getProjeto(),
                    "REQUISITO", id, AcaoAuditoria.EDICAO, "titulo",
                    requisito.getTitulo(), request.titulo()
            );
            requisito.setTitulo(request.titulo());
        }

        if (request.descricao() != null && !request.descricao().equals(requisito.getDescricao())) {
            auditoriaService.registrar(
                    usuario, null, requisito.getProjeto(),
                    "REQUISITO", id, AcaoAuditoria.EDICAO, "descricao",
                    requisito.getDescricao(), request.descricao()
            );
            requisito.setDescricao(request.descricao());
        }

        if (request.tipoRequisito() != null && !request.tipoRequisito().equals(requisito.getTipoRequisito())) {
            auditoriaService.registrar(
                    usuario, null, requisito.getProjeto(),
                    "REQUISITO", id, AcaoAuditoria.EDICAO, "tipo",
                    requisito.getTipoRequisito() != null ? requisito.getTipoRequisito().name() : null,
                    request.tipoRequisito().name()
            );
            requisito.setTipoRequisito(request.tipoRequisito());
        }

        if (request.statusId() != null) {
            StatusRequisito novoStatus = statusRequisitoRepository.findById(request.statusId())
                    .orElseThrow(() -> new StatusRequisitoService.StatusRequisitoNaoEncontradoException(request.statusId()));
            String statusAnteriorNome = requisito.getStatus() != null ? requisito.getStatus().getNome() : null;
            if (!request.statusId().equals(requisito.getStatus() != null ? requisito.getStatus().getId() : null)) {
                auditoriaService.registrar(
                        usuario, null, requisito.getProjeto(),
                        "REQUISITO", id, AcaoAuditoria.EDICAO, "status",
                        statusAnteriorNome, novoStatus.getNome()
                );
                requisito.setStatus(novoStatus);
            }
        }

        if (request.prioridadeId() != null) {
            Prioridade novaPrioridade = prioridadeRepository.findById(request.prioridadeId())
                    .orElseThrow(() -> new PrioridadeNaoEncontradaException(request.prioridadeId()));
            String prioAnteriorNome = requisito.getPrioridade() != null ? requisito.getPrioridade().getNome() : null;
            if (!request.prioridadeId().equals(requisito.getPrioridade() != null ? requisito.getPrioridade().getId() : null)) {
                auditoriaService.registrar(
                        usuario, null, requisito.getProjeto(),
                        "REQUISITO", id, AcaoAuditoria.EDICAO, "prioridade",
                        prioAnteriorNome, novaPrioridade.getNome()
                );
                requisito.setPrioridade(novaPrioridade);
            }
        }

        requisito.setVersao((requisito.getVersao() != null ? requisito.getVersao() : 1) + 1);
        requisito.setDataAtualizacao(Instant.now());
        requisito = requisitoRepository.save(requisito);
        interacaoService.registrar(usuario, requisito.getProjeto(), ModuloInteracao.REQUISITO, TipoInteracao.EDICAO, id, "Requisito atualizado: " + requisito.getTitulo());
        log.info("Requisito {} ({}) atualizado. Nova versão: v{}.0", id, requisito.getCodigo(), requisito.getVersao());
        return mapToResponseDTO(requisito);
    }

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        Requisito requisito = requisitoRepository.findById(id)
                .orElseThrow(() -> new RequisitoNaoEncontradoException(id));

        Usuario usuario = resolverUsuario(jwt);

        // ── Auditoria: inativação do requisito ───────────────────────────
        auditoriaService.registrar(
                usuario, null, requisito.getProjeto(),
                "REQUISITO", id, AcaoAuditoria.EXCLUSAO,
                "titulo", requisito.getTitulo(), null
        );

        requisito.setAtivo(false);
        requisito.setDataAtualizacao(Instant.now());
        requisitoRepository.save(requisito);
        interacaoService.registrar(usuario, requisito.getProjeto(), ModuloInteracao.REQUISITO, TipoInteracao.EXCLUSAO, id, "Requisito inativado: " + requisito.getTitulo());
        log.info("Requisito {} ({}) inativado.", id, requisito.getCodigo());
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuário autenticado não encontrado na plataforma."));
    }

    private RequisitoResponseDTO mapToResponseDTO(Requisito r) {
        return new RequisitoResponseDTO(
                r.getId(),
                r.getCodigo(),
                r.getTitulo(),
                r.getDescricao(),
                r.getTipoRequisito() != null ? r.getTipoRequisito().name() : null,
                r.getStatus() != null ? r.getStatus().getId() : null,
                r.getStatus() != null ? r.getStatus().getNome() : null,
                r.getPrioridade() != null ? r.getPrioridade().getId() : null,
                r.getPrioridade() != null ? r.getPrioridade().getNome() : null,
                r.getVersao(),
                r.getCriadoPor() != null ? r.getCriadoPor().getId() : null,
                r.getCriadoPor() != null ? r.getCriadoPor().getNome() : null,
                r.getSolicitadoPor() != null ? r.getSolicitadoPor().getId() : null,
                r.getSolicitadoPor() != null ? r.getSolicitadoPor().getNome() : null,
                r.getAprovadoPor() != null ? r.getAprovadoPor().getId() : null,
                r.getAprovadoPor() != null ? r.getAprovadoPor().getNome() : null,
                r.getDataCriacao(),
                r.getDataAtualizacao(),
                r.getDataSolicitacao(),
                r.getDataAprovacao(),
                // Contadores de rastreabilidade/modelagem (N+1 aceitável na escala do TCC)
                vinculoRequisitoRepository.countByRequisitoOrigemIdOrRequisitoDestinoId(r.getId(), r.getId()),
                impactoDadosRepository.countEntidadesDistintasByRequisitoId(r.getId())
        );
    }

    // Domain exceptions
    public static class RequisitoNaoEncontradoException extends RuntimeException {
        public RequisitoNaoEncontradoException(UUID id) {
            super("Requisito não encontrado com o id: " + id);
        }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID id) {
            super("Projeto não encontrado com o id: " + id);
        }
    }

    public static class PrioridadeNaoEncontradaException extends RuntimeException {
        public PrioridadeNaoEncontradaException(UUID id) {
            super("Prioridade não encontrada com o id: " + id);
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String msg) {
            super(msg);
        }
    }
}
