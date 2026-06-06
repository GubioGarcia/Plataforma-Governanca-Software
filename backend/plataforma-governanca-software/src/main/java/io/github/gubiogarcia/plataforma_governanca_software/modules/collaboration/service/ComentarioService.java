package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.domain.Comentario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.AtualizarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.ComentarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.CriarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.repository.ComentarioRepository;
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
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final UsuarioRepository    usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository    projetoRepository;

    // ── Listar ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ComentarioResponseDTO> listarTodos() {
        return comentarioRepository.findAll().stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponseDTO> listarPorEntidade(String entidadeTipo, UUID entidadeId) {
        return comentarioRepository
                .findAtivosByEntidade(entidadeTipo.toUpperCase(), entidadeId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public ComentarioResponseDTO criar(Jwt jwt, CriarComentarioRequestDTO request) {
        Usuario    usuario      = resolverUsuario(jwt);
        Organizacao organizacao = resolverOrganizacao(request.organizacaoId());
        Projeto    projeto      = resolverProjeto(request.projetoId());

        Comentario comentario = Comentario.builder()
                .usuario(usuario)
                .organizacao(organizacao)
                .projeto(projeto)
                .entidadeTipo(request.entidadeTipo().toUpperCase())
                .entidadeId(request.entidadeId())
                .conteudo(request.conteudo().trim())
                .ativo(true)
                .editado(false)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        Comentario salvo = comentarioRepository.save(comentario);
        log.info("Comentário criado: id={} entidade={}/{} usuário={}",
                salvo.getId(), salvo.getEntidadeTipo(), salvo.getEntidadeId(), usuario.getNome());

        return mapToDTO(salvo);
    }

    // ── Editar ────────────────────────────────────────────────────────────────

    /**
     * Apenas o autor pode editar o próprio comentário.
     * Não há restrição de edição baseada em comentários posteriores —
     * apenas de exclusão.
     */
    @Transactional
    public ComentarioResponseDTO editar(Jwt jwt, UUID comentarioId, AtualizarComentarioRequestDTO request) {
        Comentario comentario = buscarAtivo(comentarioId);
        Usuario    solicitante = resolverUsuario(jwt);

        garantirAutor(comentario, solicitante, "editar");

        comentario.setConteudo(request.conteudo().trim());
        comentario.setEditado(true);
        comentario.setDataAtualizacao(Instant.now());

        Comentario salvo = comentarioRepository.save(comentario);
        log.info("Comentário {} editado pelo usuário {}", comentarioId, solicitante.getNome());

        return mapToDTO(salvo);
    }

    // ── Deletar (soft delete) ─────────────────────────────────────────────────

    /**
     * Apenas o autor pode excluir o próprio comentário.
     *
     * Regra de negócio: um comentário que já tem outro comentário ativo após ele
     * na mesma thread NÃO pode ser excluído, pois removê-lo quebraria o contexto
     * da conversa para quem respondeu depois.
     */
    @Transactional
    public void deletar(Jwt jwt, UUID comentarioId) {
        Comentario comentario  = buscarAtivo(comentarioId);
        Usuario    solicitante = resolverUsuario(jwt);

        garantirAutor(comentario, solicitante, "excluir");

        // Bloqueia exclusão se existir comentário posterior na mesma thread
        boolean temPosterior = comentarioRepository.existsAtivoApos(
                comentario.getEntidadeTipo(),
                comentario.getEntidadeId(),
                comentario.getDataCriacao()
        );
        if (temPosterior) {
            throw new ComentarioComRespostasException(
                    "Este comentário não pode ser excluído pois já existem comentários " +
                            "posteriores a ele na conversa.");
        }

        comentario.setAtivo(false);
        comentario.setDataAtualizacao(Instant.now());
        comentarioRepository.save(comentario);
        log.info("Comentário {} inativado pelo usuário {}", comentarioId, solicitante.getNome());
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Comentario buscarAtivo(UUID id) {
        Comentario c = comentarioRepository.findById(id)
                .orElseThrow(() -> new ComentarioNaoEncontradoException(id));
        if (Boolean.FALSE.equals(c.getAtivo())) {
            throw new ComentarioNaoEncontradoException(id);
        }
        return c;
    }

    private void garantirAutor(Comentario comentario, Usuario solicitante, String acao) {
        if (!comentario.getUsuario().getId().equals(solicitante.getId())) {
            throw new ComentarioNaoAutorizadoException(
                    "Você não tem permissão para " + acao + " este comentário.");
        }
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private Organizacao resolverOrganizacao(UUID id) {
        return organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException(id));
    }

    private Projeto resolverProjeto(UUID id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(id));
    }

    private ComentarioResponseDTO mapToDTO(Comentario c) {
        return new ComentarioResponseDTO(
                c.getId(),
                c.getConteudo(),
                c.getUsuario().getId(),
                c.getUsuario().getNome(),
                c.getUsuario().getUrlMidiaPerfil(),
                c.getEntidadeTipo(),
                c.getEntidadeId(),
                c.getOrganizacao() != null ? c.getOrganizacao().getId() : null,
                c.getProjeto()     != null ? c.getProjeto().getId()     : null,
                c.getAtivo(),
                c.getEditado(),
                c.getDataCriacao(),
                c.getDataAtualizacao()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class ComentarioNaoEncontradoException extends RuntimeException {
        public ComentarioNaoEncontradoException(UUID id) {
            super("Comentário não encontrado com o id: " + id);
        }
    }

    public static class ComentarioNaoAutorizadoException extends RuntimeException {
        public ComentarioNaoAutorizadoException(String msg) { super(msg); }
    }

    public static class ComentarioComRespostasException extends RuntimeException {
        public ComentarioComRespostasException(String msg) { super(msg); }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String msg) { super(msg); }
    }

    public static class OrganizacaoNaoEncontradaException extends RuntimeException {
        public OrganizacaoNaoEncontradaException(UUID id) {
            super("Organização não encontrada com o id: " + id);
        }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID id) {
            super("Projeto não encontrado com o id: " + id);
        }
    }
}
