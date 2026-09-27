package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.domain.Comentario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.AtualizarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.ComentarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.CriarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.repository.ComentarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.repository.VisaoProdutoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
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
    private final RequisitoRepository  requisitoRepository;
    private final VisaoProdutoRepository visaoProdutoRepository;
    private final AutorizacaoService   autorizacao;

    // ── Listar ───────────────────────────────────────────────────────────────

    /** Todos os comentários da plataforma (todas as organizações): só Admin da Plataforma. */
    @Transactional(readOnly = true)
    public List<ComentarioResponseDTO> listarTodos() {
        autorizacao.exigirAdminPlataforma();
        return comentarioRepository.findAll().stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponseDTO> listarPorEntidade(String entidadeTipo, UUID entidadeId) {
        Alvo alvo = resolverAlvo(entidadeTipo, entidadeId);
        autorizacao.exigir(alvo.projeto(), alvo.permissaoVer());

        return comentarioRepository
                .findAtivosByEntidade(entidadeTipo.toUpperCase(), entidadeId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ── Criar ─────────────────────────────────────────────────────────────────

    /**
     * O projeto (e a organização) do comentário saem da entidade comentada — não do
     * corpo da requisição —, para a permissão ser checada no projeto certo.
     */
    @Transactional
    public ComentarioResponseDTO criar(Jwt jwt, CriarComentarioRequestDTO request) {
        Alvo       alvo         = resolverAlvo(request.entidadeTipo(), request.entidadeId());
        autorizacao.exigir(alvo.projeto(), alvo.permissaoComentar());

        Usuario    usuario      = resolverUsuario(jwt);
        Projeto    projeto      = alvo.projeto();
        Organizacao organizacao = projeto.getOrganizacao();

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
        exigirPermissaoDeComentar(comentario);
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
        exigirPermissaoDeComentar(comentario);
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

    /** Projeto da entidade comentada + permissões de ver e de comentar naquele tipo de entidade. */
    private record Alvo(Projeto projeto, Permissao permissaoVer, Permissao permissaoComentar) {}

    private Alvo resolverAlvo(String entidadeTipo, UUID entidadeId) {
        String tipo = entidadeTipo == null ? "" : entidadeTipo.toUpperCase();
        if (tipo.equals("REQUISITO")) {
            Projeto projeto = requisitoRepository.findById(entidadeId)
                    .orElseThrow(() -> new EntidadeComentadaNaoEncontradaException(tipo, entidadeId))
                    .getProjeto();
            return new Alvo(projeto, Permissao.REQ_VIEW, Permissao.REQ_COMMENT);
        }
        if (tipo.startsWith("WIKI")) {   // WIKI_DESCRICAO, WIKI_PROBLEMA... → entidadeId é a VisaoProduto
            Projeto projeto = visaoProdutoRepository.findById(entidadeId)
                    .orElseThrow(() -> new EntidadeComentadaNaoEncontradaException(tipo, entidadeId))
                    .getProjeto();
            return new Alvo(projeto, Permissao.WIKI_VIEW, Permissao.WIKI_COMMENT);
        }
        throw new TipoEntidadeComentarioInvalidoException(entidadeTipo);
    }

    private void exigirPermissaoDeComentar(Comentario comentario) {
        Permissao permissao = comentario.getEntidadeTipo().startsWith("WIKI")
                ? Permissao.WIKI_COMMENT
                : Permissao.REQ_COMMENT;
        autorizacao.exigir(comentario.getProjeto(), permissao);
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

    public static class EntidadeComentadaNaoEncontradaException extends RuntimeException {
        public EntidadeComentadaNaoEncontradaException(String tipo, UUID id) {
            super("Entidade " + tipo + " não encontrada com o id: " + id);
        }
    }

    public static class TipoEntidadeComentarioInvalidoException extends RuntimeException {
        public TipoEntidadeComentarioInvalidoException(String tipo) {
            super("Tipo de entidade não aceita comentários: " + tipo + ". Use REQUISITO ou WIKI_*.");
        }
    }
}
