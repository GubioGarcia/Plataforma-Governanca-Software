package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.Auditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AtualizarAuditoriaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AuditoriaResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.CriarAuditoriaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.repository.AuditoriaRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
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
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository    usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository    projetoRepository;

    // ── Listagens ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarTodos() {
        return auditoriaRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getDataAlteracao().compareTo(a.getDataAlteracao()))
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Lista auditorias filtrando por entidadeTipo e/ou entidadeId.
     * Se ambos informados: retorna mudanças de um registro específico.
     * Se apenas entidadeTipo: retorna todas as mudanças daquele tipo.
     */
    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarPorEntidade(String entidadeTipo, UUID entidadeId) {
        return auditoriaRepository
                .findByEntidade(entidadeTipo.toUpperCase(), entidadeId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarPorTipo(String entidadeTipo) {
        return auditoriaRepository
                .findByEntidadeTipo(entidadeTipo.toUpperCase())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listarPorProjeto(UUID projetoId, String entidadeTipo) {
        List<Auditoria> result = (entidadeTipo != null && !entidadeTipo.isBlank())
                ? auditoriaRepository.findByProjetoIdAndEntidadeTipo(projetoId, entidadeTipo.toUpperCase())
                : auditoriaRepository.findByProjetoId(projetoId);
        return result.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public AuditoriaResponseDTO buscarPorId(UUID id) {
        Auditoria auditoria = auditoriaRepository.findById(id)
                .orElseThrow(() -> new AuditoriaNaoEncontradaException(id));
        return mapToDTO(auditoria);
    }

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuditoriaResponseDTO criar(Jwt jwt, CriarAuditoriaRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        Organizacao organizacao = null;
        if (request.organizacaoId() != null) {
            organizacao = organizacaoRepository.findById(request.organizacaoId()).orElse(null);
        }

        Projeto projeto = null;
        if (request.projetoId() != null) {
            projeto = projetoRepository.findById(request.projetoId()).orElse(null);
        }

        Auditoria auditoria = Auditoria.builder()
                .organizacao(organizacao)
                .projeto(projeto)
                .entidadeTipo(request.entidadeTipo().toUpperCase())
                .entidadeId(request.entidadeId())
                .acao(request.acao())
                .campoAlterado(request.campoAlterado())
                .valorAnterior(request.valorAnterior())
                .valorNovo(request.valorNovo())
                .usuario(usuario)
                .dataAlteracao(Instant.now())
                .build();

        Auditoria salva = auditoriaRepository.save(auditoria);
        log.info("Auditoria registrada: entidade={}/{} acao={} campo={} usuario={}",
                salva.getEntidadeTipo(), salva.getEntidadeId(),
                salva.getAcao(), salva.getCampoAlterado(), usuario.getNome());
        return mapToDTO(salva);
    }

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

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public AuditoriaResponseDTO atualizar(UUID id, AtualizarAuditoriaRequestDTO request) {
        Auditoria auditoria = auditoriaRepository.findById(id)
                .orElseThrow(() -> new AuditoriaNaoEncontradaException(id));

        if (request.campoAlterado() != null) auditoria.setCampoAlterado(request.campoAlterado());
        if (request.valorAnterior() != null) auditoria.setValorAnterior(request.valorAnterior());
        if (request.valorNovo()     != null) auditoria.setValorNovo(request.valorNovo());

        Auditoria salva = auditoriaRepository.save(auditoria);
        log.info("Auditoria {} atualizada.", id);
        return mapToDTO(salva);
    }

    // ── Deletar ───────────────────────────────────────────────────────────────

    @Transactional
    public void deletar(UUID id) {
        Auditoria auditoria = auditoriaRepository.findById(id)
                .orElseThrow(() -> new AuditoriaNaoEncontradaException(id));
        auditoriaRepository.delete(auditoria);
        log.info("Auditoria {} removida.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

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

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String msg) { super(msg); }
    }
}
