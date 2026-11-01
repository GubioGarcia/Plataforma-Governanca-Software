package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.Auditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AuditoriaResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.repository.AuditoriaRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.ProjetoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import io.github.gubiogarcia.plataforma_governanca_software.shared.PaginaDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final ProjetoRepository   projetoRepository;
    private final AutorizacaoService  autorizacao;
    private final UsuarioRepository   usuarioRepository;

    // ── Listagens ─────────────────────────────────────────────────────────────

    /**
     * Histórico de um registro específico (card de auditoria do requisito, da wiki...).
     * Exige AUDIT_HISTORICO_VIEW no projeto de cada registro retornado.
     */
    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarPorEntidade(String entidadeTipo, UUID entidadeId) {
        List<Auditoria> registros = auditoriaRepository.findByEntidade(entidadeTipo.toUpperCase(), entidadeId);
        registros.forEach(this::exigirHistorico);
        return registros.stream().map(this::mapToDTO).toList();
    }

    /** Tela completa de auditoria do projeto: AUDIT_VIEW. */
    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarPorProjeto(UUID projetoId, String entidadeTipo) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoService.ProjetoNaoEncontradoException(
                        "Nenhum projeto encontrado com o id: " + projetoId));
        autorizacao.exigir(projeto, Permissao.AUDIT_VIEW);

        List<Auditoria> result = (entidadeTipo != null && !entidadeTipo.isBlank())
                ? auditoriaRepository.findByProjetoIdAndEntidadeTipo(projetoId, entidadeTipo.toUpperCase())
                : auditoriaRepository.findByProjetoId(projetoId);
        return result.stream().map(this::mapToDTO).toList();
    }

    /**
     * Auditoria administrativa: só os registros sem organização e sem projeto (ações
     * do Admin da Plataforma), do mais recente ao mais antigo. Filtros opcionais.
     */
    @Transactional(readOnly = true)
    public PaginaDTO<AuditoriaResponseDTO> listarAdministrativa(int pagina, int tamanho, AcaoAuditoria acao,
                                                                Instant de, Instant ate) {
        autorizacao.exigirAdminPlataforma();
        Specification<Auditoria> filtro = (root, query, cb) -> cb.and(
                cb.isNull(root.get("organizacao")), cb.isNull(root.get("projeto")));
        if (acao != null) filtro = filtro.and((root, query, cb) -> cb.equal(root.get("acao"), acao));
        if (de != null) filtro = filtro.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dataAlteracao"), de));
        if (ate != null) filtro = filtro.and((root, query, cb) -> cb.lessThan(root.get("dataAlteracao"), ate));

        var page = auditoriaRepository.findAll(filtro, PageRequest.of(
                Math.max(pagina, 0), Math.clamp(tamanho, 1, 100), Sort.by("dataAlteracao").descending()));
        return PaginaDTO.de(page, this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public AuditoriaResponseDTO buscarPorId(UUID id) {
        Auditoria auditoria = auditoriaRepository.findById(id)
                .orElseThrow(() -> new AuditoriaNaoEncontradaException(id));
        exigirHistorico(auditoria);
        return mapToDTO(auditoria);
    }

    /** Registro de projeto → AUDIT_HISTORICO_VIEW; só de organização → vínculo; sem nenhum → Admin da Plataforma. */
    private void exigirHistorico(Auditoria auditoria) {
        if (auditoria.getProjeto() != null) {
            autorizacao.exigir(auditoria.getProjeto(), Permissao.AUDIT_HISTORICO_VIEW);
        } else if (auditoria.getOrganizacao() != null) {
            autorizacao.exigirVinculo(auditoria.getOrganizacao());
        } else {
            autorizacao.exigirAdminPlataforma();
        }
    }

    // ── Registrar ─────────────────────────────────────────────────────────────

    /**
     * Método interno — chamado pelos Services de domínio para registrar
     * automaticamente uma auditoria sem necessitar de Jwt.
     *
     * @param acao  Tipo da operação: CRIACAO, EDICAO ou EXCLUSAO
     */
    @Transactional
    public void registrar(
            Usuario       usuario,
            Organizacao   organizacao,
            Projeto       projeto,
            String        entidadeTipo,
            UUID          entidadeId,
            AcaoAuditoria acao,
            String        campoAlterado,
            String        valorAnterior,
            String        valorNovo
    ) {
        if (valorAnterior == null && valorNovo == null) return;
        if (AcaoAuditoria.EDICAO.equals(acao)
                && valorAnterior != null
                && valorAnterior.equals(valorNovo)) return;

        Auditoria auditoria = Auditoria.builder()
                .organizacao(organizacao)
                .projeto(projeto)
                .entidadeTipo(entidadeTipo.toUpperCase())
                .entidadeId(entidadeId)
                .acao(acao)
                .campoAlterado(campoAlterado)
                .valorAnterior(valorAnterior)
                .valorNovo(valorNovo)
                .usuario(usuario)
                .dataAlteracao(Instant.now())
                .build();

        auditoriaRepository.save(auditoria);
        log.debug("Auditoria: entidade={}/{} acao={} campo={} anterior='{}' novo='{}'",
                entidadeTipo, entidadeId, acao, campoAlterado, valorAnterior, valorNovo);
    }

    /**
     * Registro de uma ação administrativa (sem organização nem projeto), feita pelo
     * usuário autenticado — aparece na auditoria da área administrativa.
     */
    @Transactional
    public void registrarAdministrativa(String entidadeTipo, UUID entidadeId, AcaoAuditoria acao,
                                        String campoAlterado, String valorAnterior, String valorNovo) {
        Usuario autor = usuarioRepository.findByExternalIdentityId(autorizacao.keycloakIdAtual()).orElse(null);
        registrar(autor, null, null, entidadeTipo, entidadeId, acao, campoAlterado, valorAnterior, valorNovo);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuditoriaResponseDTO mapToDTO(Auditoria a) {
        return new AuditoriaResponseDTO(
                a.getId(),
                a.getOrganizacao() != null ? a.getOrganizacao().getId()           : null,
                a.getProjeto()     != null ? a.getProjeto().getId()               : null,
                a.getEntidadeTipo(),
                a.getEntidadeId(),
                a.getAcao(),
                a.getCampoAlterado(),
                a.getValorAnterior(),
                a.getValorNovo(),
                a.getUsuario()     != null ? a.getUsuario().getId()               : null,
                a.getUsuario()     != null ? a.getUsuario().getNome()             : null,
                a.getUsuario()     != null ? a.getUsuario().getUrlMidiaPerfil()   : null,
                a.getDataAlteracao()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class AuditoriaNaoEncontradaException extends RuntimeException {
        public AuditoriaNaoEncontradaException(UUID id) {
            super("Auditoria não encontrada com o id: " + id);
        }
    }
}
