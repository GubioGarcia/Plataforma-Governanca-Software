package io.github.gubiogarcia.plataforma_governanca_software.modules.product.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.domain.VisaoProduto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.AtualizarVisaoProdutoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.VisaoProdutoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.repository.VisaoProdutoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisaoProdutoService {

    private final VisaoProdutoRepository visaoProdutoRepository;
    private final ProjetoRepository projetoRepository;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;
    private final InteracaoService interacaoService;

    @Transactional
    public VisaoProduto inicializarParaProjeto(Projeto projeto) {
        Instant agora = Instant.now();
        VisaoProduto visao = VisaoProduto.builder()
                .projeto(projeto)
                .dataCriacao(agora)
                .dataAtualizacao(agora)
                .build();
        visao = visaoProdutoRepository.save(visao);
        log.info("VisaoProduto inicializada para o projeto '{}'. ID: {}", projeto.getNome(), visao.getId());
        return visao;
    }

    @Transactional(readOnly = true)
    public VisaoProdutoResponseDTO buscarPorProjetoId(UUID projetoId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));
        VisaoProduto visao = visaoProdutoRepository.findByProjetoId(projetoId)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(projetoId));
        return mapToResponseDTO(visao, projeto);
    }

    @Transactional(readOnly = true)
    public VisaoProdutoResponseDTO buscarPorId(UUID id) {
        VisaoProduto visao = visaoProdutoRepository.findById(id)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(id));
        return mapToResponseDTO(visao, visao.getProjeto());
    }

    @Transactional
    public VisaoProdutoResponseDTO atualizar(Jwt jwt, UUID projetoId, AtualizarVisaoProdutoRequestDTO request) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));

        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ProjetoInativoException(projetoId);
        }

        VisaoProduto visao = visaoProdutoRepository.findByProjetoId(projetoId)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(projetoId));

        Usuario usuario = resolverUsuario(jwt);
        UUID wikiId = visao.getId();

        // ── Auditoria campo a campo ───────────────────────────────────────
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_PROBLEMA",
                "descricao_problema", visao.getDescricaoProblema(), request.descricaoProblema());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_PUBLICO",
                "publico_alvo", visao.getPublicoAlvo(), request.publicoAlvo());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_OBJETIVOS",
                "objetivo_geral", visao.getObjetivoGeral(), request.objetivoGeral());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_OBJETIVOS",
                "objetivos_especificos", visao.getObjetivosEspecificos(), request.objetivosEspecificos());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_OBJETIVOS",
                "kpis", visao.getKpis(), request.kpis());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_RESTRICOES",
                "restricoes_prazo", visao.getRestricoesPrazo(), request.restricoesPrazo());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_RESTRICOES",
                "restricoes_orcamento", visao.getRestricoesOrcamento(), request.restricoesOrcamento());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_RESTRICOES",
                "tecnologias_obrigatorias", visao.getTecnologiasObrigatorias(), request.tecnologiasObrigatorias());
        registrarSeAlterado(usuario, projeto, wikiId, "WIKI_RESTRICOES",
                "regulamentacoes", visao.getRegulamentacoes(), request.regulamentacoes());

        Instant agora = Instant.now();

        visao.setDescricaoProblema(request.descricaoProblema());
        visao.setPublicoAlvo(request.publicoAlvo());
        visao.setObjetivoGeral(request.objetivoGeral());
        visao.setObjetivosEspecificos(request.objetivosEspecificos());
        visao.setKpis(request.kpis());
        visao.setRestricoesPrazo(request.restricoesPrazo());
        visao.setRestricoesOrcamento(request.restricoesOrcamento());
        visao.setTecnologiasObrigatorias(request.tecnologiasObrigatorias());
        visao.setRegulamentacoes(request.regulamentacoes());
        visao.setDataAtualizacao(agora);

        // Propaga data_atualizacao para o Projeto pai
        projeto.setDataAtualizacao(agora);
        projetoRepository.save(projeto);

        visao = visaoProdutoRepository.save(visao);
        interacaoService.registrar(usuario, projeto, ModuloInteracao.WIKI, TipoInteracao.EDICAO, visao.getId(), "Wiki editada");
        log.info("VisaoProduto do projeto {} atualizada com sucesso.", projetoId);
        return mapToResponseDTO(visao, projeto);
    }

    /** Registra auditoria apenas se o valor tiver mudado. */
    private void registrarSeAlterado(
            Usuario usuario, Projeto projeto, UUID entidadeId,
            String entidadeTipo, String campo, String anterior, String novo) {
        if (!java.util.Objects.equals(anterior, novo)) {
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    entidadeTipo, entidadeId, AcaoAuditoria.EDICAO,
                    campo, anterior, novo
            );
        }
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private VisaoProdutoResponseDTO mapToResponseDTO(VisaoProduto v, Projeto p) {
        return new VisaoProdutoResponseDTO(
                v.getId(),
                p.getId(),
                p.getNome(),
                p.getDescricao(),
                p.getCriadoPor().getId(),
                p.getCriadoPor().getNome(),
                p.getStatus() != null ? p.getStatus().getNome() : null,
                p.getDataCriacao(),
                p.getDataAtualizacao(),
                v.getDescricaoProblema(),
                v.getPublicoAlvo(),
                v.getObjetivoGeral(),
                v.getObjetivosEspecificos(),
                v.getKpis(),
                v.getRestricoesPrazo(),
                v.getRestricoesOrcamento(),
                v.getTecnologiasObrigatorias(),
                v.getRegulamentacoes(),
                v.getDataCriacao(),
                v.getDataAtualizacao());
    }

    // Domain exceptions
    public static class VisaoProdutoNaoEncontradaException extends RuntimeException {
        public VisaoProdutoNaoEncontradaException(UUID id) {
            super("Wiki não encontrada para o id: " + id);
        }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID projetoId) {
            super("Nenhum projeto encontrado com o id: " + projetoId);
        }
    }

    public static class ProjetoInativoException extends RuntimeException {
        public ProjetoInativoException(UUID projetoId) {
            super("Não é possível editar a Wiki do projeto com id " + projetoId + " pois ele está inativo.");
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String msg) { super(msg); }
    }
}
