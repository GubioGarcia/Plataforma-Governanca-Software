package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.RelacionamentoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.RelacionamentoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD dos relacionamentos (FKs) entre entidades de negócio de um projeto.
 * Base de dados já pronta para a rastreabilidade indireta via cadeia de FKs
 * (Opção 1C do estudo), ainda não implementada.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RelacionamentoEntidadeService {

    private final RelacionamentoEntidadeRepository relacionamentoEntidadeRepository;
    private final EntidadeDadosRepository entidadeDadosRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public RelacionamentoEntidadeResponseDTO criar(Jwt jwt, CriarRelacionamentoEntidadeRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        if (request.entidadeOrigemId().equals(request.entidadeDestinoId())) {
            throw new RelacionamentoEntidadeReflexivoException();
        }

        EntidadeDados origem = entidadeDadosRepository.findById(request.entidadeOrigemId())
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(request.entidadeOrigemId()));
        EntidadeDados destino = entidadeDadosRepository.findById(request.entidadeDestinoId())
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(request.entidadeDestinoId()));

        if (!origem.getProjeto().getId().equals(destino.getProjeto().getId())) {
            throw new EntidadesDeProjetosDiferentesException();
        }
        if (relacionamentoEntidadeRepository.existsByEntidadeOrigemIdAndEntidadeDestinoIdAndTipo(
                origem.getId(), destino.getId(), request.tipo())) {
            throw new RelacionamentoEntidadeDuplicadoException();
        }

        RelacionamentoEntidade rel = RelacionamentoEntidade.builder()
                .entidadeOrigem(origem)
                .entidadeDestino(destino)
                .tipo(request.tipo())
                .build();

        rel = relacionamentoEntidadeRepository.save(rel);
        log.info("RelacionamentoEntidade {} criado: {} -> {} ({}).",
                rel.getId(), origem.getNome(), destino.getNome(), request.tipo());

        Projeto projeto = origem.getProjeto();
        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "RELACIONAMENTO_ENTIDADE", rel.getId(), AcaoAuditoria.CRIACAO,
                "relacionamento", null, origem.getNome() + " -> " + destino.getNome() + " (" + request.tipo() + ")"
        );
        interacaoService.registrar(usuario, projeto, ModuloInteracao.MODELAGEM_DADOS, TipoInteracao.CRIACAO,
                rel.getId(), "Relacionamento criado: " + origem.getNome() + " -> " + destino.getNome());

        return mapToResponseDTO(rel);
    }

    // ── Listar ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RelacionamentoEntidadeResponseDTO> listarPorProjeto(UUID projetoId) {
        return relacionamentoEntidadeRepository.findAllByProjetoId(projetoId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RelacionamentoEntidadeResponseDTO> listarPorEntidade(UUID entidadeId) {
        if (!entidadeDadosRepository.existsById(entidadeId)) {
            throw new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId);
        }
        return relacionamentoEntidadeRepository
                .findAllByEntidadeOrigemIdOrEntidadeDestinoId(entidadeId, entidadeId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public RelacionamentoEntidadeResponseDTO buscarPorId(UUID id) {
        return mapToResponseDTO(carregar(id));
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public RelacionamentoEntidadeResponseDTO atualizar(Jwt jwt, UUID id, AtualizarRelacionamentoEntidadeRequestDTO request) {
        RelacionamentoEntidade rel = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = rel.getEntidadeOrigem().getProjeto();

        if (!request.tipo().equals(rel.getTipo())) {
            if (relacionamentoEntidadeRepository.existsByEntidadeOrigemIdAndEntidadeDestinoIdAndTipo(
                    rel.getEntidadeOrigem().getId(), rel.getEntidadeDestino().getId(), request.tipo())) {
                throw new RelacionamentoEntidadeDuplicadoException();
            }
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "RELACIONAMENTO_ENTIDADE", id, AcaoAuditoria.EDICAO, "tipo",
                    rel.getTipo().name(), request.tipo().name()
            );
            rel.setTipo(request.tipo());
        }

        rel = relacionamentoEntidadeRepository.save(rel);
        log.info("RelacionamentoEntidade {} atualizado.", id);
        return mapToResponseDTO(rel);
    }

    // ── Deletar (hard delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        RelacionamentoEntidade rel = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto = rel.getEntidadeOrigem().getProjeto();

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "RELACIONAMENTO_ENTIDADE", id, AcaoAuditoria.EXCLUSAO,
                "relacionamento",
                rel.getEntidadeOrigem().getNome() + " -> " + rel.getEntidadeDestino().getNome() + " (" + rel.getTipo() + ")",
                null
        );

        relacionamentoEntidadeRepository.deleteById(id);
        log.info("RelacionamentoEntidade {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RelacionamentoEntidade carregar(UUID id) {
        return relacionamentoEntidadeRepository.findById(id)
                .orElseThrow(() -> new RelacionamentoEntidadeNaoEncontradoException(id));
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new EntidadeDadosService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private RelacionamentoEntidadeResponseDTO mapToResponseDTO(RelacionamentoEntidade r) {
        return new RelacionamentoEntidadeResponseDTO(
                r.getId(),
                r.getEntidadeOrigem() != null ? r.getEntidadeOrigem().getId() : null,
                r.getEntidadeOrigem() != null ? r.getEntidadeOrigem().getNome() : null,
                r.getEntidadeDestino() != null ? r.getEntidadeDestino().getId() : null,
                r.getEntidadeDestino() != null ? r.getEntidadeDestino().getNome() : null,
                r.getTipo()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class RelacionamentoEntidadeNaoEncontradoException extends RuntimeException {
        public RelacionamentoEntidadeNaoEncontradoException(UUID id) {
            super("Relacionamento de entidade não encontrado com o id: " + id);
        }
    }

    public static class RelacionamentoEntidadeDuplicadoException extends RuntimeException {
        public RelacionamentoEntidadeDuplicadoException() {
            super("Já existe um relacionamento entre essas entidades com o mesmo tipo.");
        }
    }

    public static class RelacionamentoEntidadeReflexivoException extends RuntimeException {
        public RelacionamentoEntidadeReflexivoException() {
            super("Uma entidade não pode se relacionar com ela mesma.");
        }
    }

    public static class EntidadesDeProjetosDiferentesException extends RuntimeException {
        public EntidadesDeProjetosDiferentesException() {
            super("As entidades de origem e destino pertencem a projetos diferentes.");
        }
    }
}
