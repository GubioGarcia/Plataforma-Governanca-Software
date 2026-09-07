package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.AtributoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.RelacionamentoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
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

/**
 * Núcleo da modelagem de dados (Ponto 2A/2B do estudo de evolução): CRUD de
 * entidades de negócio de um projeto e montagem do diagrama ER.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EntidadeDadosService {

    private final EntidadeDadosRepository entidadeDadosRepository;
    private final ProjetoRepository projetoRepository;
    private final AtributoEntidadeRepository atributoEntidadeRepository;
    private final RelacionamentoEntidadeRepository relacionamentoEntidadeRepository;
    private final ImpactoDadosRepository impactoDadosRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public EntidadeDadosResponseDTO criar(Jwt jwt, UUID projetoId, CriarEntidadeDadosRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));
        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ProjetoInativoException(projetoId);
        }
        if (entidadeDadosRepository.existsByProjetoIdAndNomeIgnoreCase(projetoId, request.nome())) {
            throw new EntidadeDadosNomeJaExisteException(request.nome());
        }

        EntidadeDados entidade = EntidadeDados.builder()
                .projeto(projeto)
                .nome(request.nome())
                .descricao(request.descricao())
                .criadoPor(usuario)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        entidade = entidadeDadosRepository.save(entidade);
        log.info("EntidadeDados '{}' criada no projeto {}. ID: {}", entidade.getNome(), projetoId, entidade.getId());

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ENTIDADE_DADOS", entidade.getId(), AcaoAuditoria.CRIACAO,
                "nome", null, entidade.getNome()
        );
        interacaoService.registrar(usuario, projeto, ModuloInteracao.MODELAGEM_DADOS, TipoInteracao.CRIACAO,
                entidade.getId(), "Entidade de dados criada: " + entidade.getNome());

        return mapToResponseDTO(entidade);
    }

    // ── Listar / Buscar ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EntidadeDadosResponseDTO> listarPorProjeto(UUID projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new ProjetoNaoEncontradoException(projetoId);
        }
        return entidadeDadosRepository.findAllByProjetoIdAndAtivoTrue(projetoId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EntidadeDadosDetalheResponseDTO buscarPorId(UUID id) {
        EntidadeDados entidade = entidadeDadosRepository.findById(id)
                .orElseThrow(() -> new EntidadeDadosNaoEncontradaException(id));
        return mapToDetalheDTO(entidade);
    }

    /**
     * Monta a fonte de dados do diagrama ER do projeto: todas as entidades
     * ativas com seus atributos e todos os relacionamentos entre elas.
     */
    @Transactional(readOnly = true)
    public DiagramaProjetoResponseDTO montarDiagrama(UUID projetoId, UUID entidadeDestacadaId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new ProjetoNaoEncontradoException(projetoId);
        }
        List<EntidadeDadosDetalheResponseDTO> entidades = entidadeDadosRepository
                .findAllByProjetoIdAndAtivoTrue(projetoId).stream()
                .map(this::mapToDetalheDTO)
                .toList();
        List<RelacionamentoEntidadeResponseDTO> relacionamentos = relacionamentoEntidadeRepository
                .findAllByProjetoId(projetoId).stream()
                .map(this::mapRelacionamento)
                .toList();
        return new DiagramaProjetoResponseDTO(projetoId, entidadeDestacadaId, entidades, relacionamentos);
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public EntidadeDadosResponseDTO atualizar(Jwt jwt, UUID id, AtualizarEntidadeDadosRequestDTO request) {
        EntidadeDados entidade = entidadeDadosRepository.findById(id)
                .orElseThrow(() -> new EntidadeDadosNaoEncontradaException(id));
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = entidade.getProjeto();

        if (request.nome() != null && !request.nome().equals(entidade.getNome())) {
            if (entidadeDadosRepository.existsByProjetoIdAndNomeIgnoreCase(projeto.getId(), request.nome())) {
                throw new EntidadeDadosNomeJaExisteException(request.nome());
            }
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ENTIDADE_DADOS", id, AcaoAuditoria.EDICAO, "nome",
                    entidade.getNome(), request.nome()
            );
            entidade.setNome(request.nome());
        }

        if (request.descricao() != null && !request.descricao().equals(entidade.getDescricao())) {
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ENTIDADE_DADOS", id, AcaoAuditoria.EDICAO, "descricao",
                    entidade.getDescricao(), request.descricao()
            );
            entidade.setDescricao(request.descricao());
        }

        entidade.setDataAtualizacao(Instant.now());
        entidade = entidadeDadosRepository.save(entidade);
        interacaoService.registrar(usuario, projeto, ModuloInteracao.MODELAGEM_DADOS, TipoInteracao.EDICAO,
                id, "Entidade de dados atualizada: " + entidade.getNome());
        log.info("EntidadeDados {} atualizada.", id);
        return mapToResponseDTO(entidade);
    }

    // ── Deletar (soft delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        EntidadeDados entidade = entidadeDadosRepository.findById(id)
                .orElseThrow(() -> new EntidadeDadosNaoEncontradaException(id));
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = entidade.getProjeto();

        if (impactoDadosRepository.existsByEntidadeId(id)) {
            throw new EntidadeDadosEmUsoException(id);
        }

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ENTIDADE_DADOS", id, AcaoAuditoria.EXCLUSAO,
                "nome", entidade.getNome(), null
        );

        entidade.setAtivo(false);
        entidade.setDataAtualizacao(Instant.now());
        entidadeDadosRepository.save(entidade);
        interacaoService.registrar(usuario, projeto, ModuloInteracao.MODELAGEM_DADOS, TipoInteracao.EXCLUSAO,
                id, "Entidade de dados removida: " + entidade.getNome());
        log.info("EntidadeDados {} inativada.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private EntidadeDadosResponseDTO mapToResponseDTO(EntidadeDados e) {
        return new EntidadeDadosResponseDTO(
                e.getId(),
                e.getProjeto() != null ? e.getProjeto().getId() : null,
                e.getNome(),
                e.getDescricao(),
                e.getAtivo(),
                e.getCriadoPor() != null ? e.getCriadoPor().getId() : null,
                e.getCriadoPor() != null ? e.getCriadoPor().getNome() : null,
                e.getDataCriacao(),
                e.getDataAtualizacao(),
                atributoEntidadeRepository.countByEntidadeId(e.getId()),
                impactoDadosRepository.countRequisitosAtivosQueImpactam(e.getId())
        );
    }

    private EntidadeDadosDetalheResponseDTO mapToDetalheDTO(EntidadeDados e) {
        List<AtributoEntidadeResponseDTO> atributos = atributoEntidadeRepository
                .findAllByEntidadeIdOrderByOrdemAscNomeAsc(e.getId()).stream()
                .map(this::mapAtributo)
                .toList();
        List<RelacionamentoEntidadeResponseDTO> relacionamentos = relacionamentoEntidadeRepository
                .findAllByEntidadeOrigemIdOrEntidadeDestinoId(e.getId(), e.getId()).stream()
                .map(this::mapRelacionamento)
                .toList();
        return new EntidadeDadosDetalheResponseDTO(
                e.getId(),
                e.getProjeto() != null ? e.getProjeto().getId() : null,
                e.getNome(),
                e.getDescricao(),
                e.getAtivo(),
                e.getCriadoPor() != null ? e.getCriadoPor().getId() : null,
                e.getCriadoPor() != null ? e.getCriadoPor().getNome() : null,
                e.getDataCriacao(),
                e.getDataAtualizacao(),
                atributos,
                relacionamentos
        );
    }

    private AtributoEntidadeResponseDTO mapAtributo(AtributoEntidade a) {
        return new AtributoEntidadeResponseDTO(
                a.getId(),
                a.getEntidade() != null ? a.getEntidade().getId() : null,
                a.getNome(),
                a.getTipo(),
                a.getObrigatorio(),
                a.getChavePrimaria(),
                a.getOrdem()
        );
    }

    private RelacionamentoEntidadeResponseDTO mapRelacionamento(RelacionamentoEntidade r) {
        return new RelacionamentoEntidadeResponseDTO(
                r.getId(),
                r.getEntidadeOrigem() != null ? r.getEntidadeOrigem().getId() : null,
                r.getEntidadeOrigem() != null ? r.getEntidadeOrigem().getNome() : null,
                r.getEntidadeDestino() != null ? r.getEntidadeDestino().getId() : null,
                r.getEntidadeDestino() != null ? r.getEntidadeDestino().getNome() : null,
                r.getTipo(),
                r.getAtributoFk()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class EntidadeDadosNaoEncontradaException extends RuntimeException {
        public EntidadeDadosNaoEncontradaException(UUID id) {
            super("Entidade de dados não encontrada com o id: " + id);
        }
    }

    public static class EntidadeDadosNomeJaExisteException extends RuntimeException {
        public EntidadeDadosNomeJaExisteException(String nome) {
            super("Já existe uma entidade de dados com o nome '" + nome + "' neste projeto.");
        }
    }

    public static class EntidadeDadosEmUsoException extends RuntimeException {
        public EntidadeDadosEmUsoException(UUID id) {
            super("A entidade de dados " + id + " é referenciada por registros de impacto e não pode ser removida.");
        }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID id) {
            super("Projeto não encontrado com o id: " + id);
        }
    }

    public static class ProjetoInativoException extends RuntimeException {
        public ProjetoInativoException(UUID id) {
            super("O projeto " + id + " está inativo e não aceita novas entidades de dados.");
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String msg) {
            super(msg);
        }
    }
}
