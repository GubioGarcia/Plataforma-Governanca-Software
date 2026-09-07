package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.AtributoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD de atributos (colunas) de uma EntidadeDados. Entidade filha —
 * hard delete, no mesmo padrão de CriterioAceite.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AtributoEntidadeService {

    private final AtributoEntidadeRepository atributoEntidadeRepository;
    private final EntidadeDadosRepository entidadeDadosRepository;
    private final ImpactoDadosRepository impactoDadosRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public AtributoEntidadeResponseDTO criar(Jwt jwt, UUID entidadeId, CriarAtributoEntidadeRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);
        EntidadeDados entidade = entidadeDadosRepository.findById(entidadeId)
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId));

        if (atributoEntidadeRepository.existsByEntidadeIdAndNomeIgnoreCase(entidadeId, request.nome())) {
            throw new AtributoEntidadeNomeJaExisteException(request.nome());
        }

        AtributoEntidade atributo = AtributoEntidade.builder()
                .entidade(entidade)
                .nome(request.nome())
                .tipo(request.tipo())
                .obrigatorio(request.obrigatorio())
                .ordem(request.ordem())
                .build();

        atributo = atributoEntidadeRepository.save(atributo);
        log.info("AtributoEntidade '{}' criado na entidade {}. ID: {}", atributo.getNome(), entidadeId, atributo.getId());

        Projeto projeto = entidade.getProjeto();
        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ATRIBUTO_ENTIDADE", atributo.getId(), AcaoAuditoria.CRIACAO,
                "nome", null, atributo.getNome()
        );
        return mapToResponseDTO(atributo);
    }

    // ── Listar / Buscar ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AtributoEntidadeResponseDTO> listarPorEntidade(UUID entidadeId) {
        if (!entidadeDadosRepository.existsById(entidadeId)) {
            throw new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId);
        }
        return atributoEntidadeRepository.findAllByEntidadeIdOrderByOrdemAscNomeAsc(entidadeId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AtributoEntidadeResponseDTO buscarPorId(UUID id) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        return mapToResponseDTO(atributo);
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public AtributoEntidadeResponseDTO atualizar(Jwt jwt, UUID id, AtualizarAtributoEntidadeRequestDTO request) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        Usuario usuario = resolverUsuario(jwt);
        EntidadeDados entidade = atributo.getEntidade();
        Projeto projeto = entidade.getProjeto();

        if (request.nome() != null && !request.nome().equals(atributo.getNome())) {
            if (atributoEntidadeRepository.existsByEntidadeIdAndNomeIgnoreCase(entidade.getId(), request.nome())) {
                throw new AtributoEntidadeNomeJaExisteException(request.nome());
            }
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EDICAO, "nome",
                    atributo.getNome(), request.nome()
            );
            atributo.setNome(request.nome());
        }

        if (request.tipo() != null && !request.tipo().equals(atributo.getTipo())) {
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EDICAO, "tipo",
                    atributo.getTipo(), request.tipo()
            );
            atributo.setTipo(request.tipo());
        }

        if (request.obrigatorio() != null && !request.obrigatorio().equals(atributo.getObrigatorio())) {
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EDICAO, "obrigatorio",
                    String.valueOf(atributo.getObrigatorio()), String.valueOf(request.obrigatorio())
            );
            atributo.setObrigatorio(request.obrigatorio());
        }

        if (request.ordem() != null) {
            atributo.setOrdem(request.ordem());
        }

        atributo = atributoEntidadeRepository.save(atributo);
        log.info("AtributoEntidade {} atualizado.", id);
        return mapToResponseDTO(atributo);
    }

    // ── Deletar (hard delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        Usuario usuario = resolverUsuario(jwt);
        EntidadeDados entidade = atributo.getEntidade();
        Projeto projeto = entidade.getProjeto();

        if (impactoDadosRepository.existsByAtributoId(id)) {
            throw new AtributoEntidadeEmUsoException(id);
        }

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EXCLUSAO,
                "nome", atributo.getNome(), null
        );

        atributoEntidadeRepository.deleteById(id);
        log.info("AtributoEntidade {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new EntidadeDadosService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private AtributoEntidadeResponseDTO mapToResponseDTO(AtributoEntidade a) {
        return new AtributoEntidadeResponseDTO(
                a.getId(),
                a.getEntidade() != null ? a.getEntidade().getId() : null,
                a.getNome(),
                a.getTipo(),
                a.getObrigatorio(),
                a.getOrdem()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class AtributoEntidadeNaoEncontradoException extends RuntimeException {
        public AtributoEntidadeNaoEncontradoException(UUID id) {
            super("Atributo de entidade não encontrado com o id: " + id);
        }
    }

    public static class AtributoEntidadeNomeJaExisteException extends RuntimeException {
        public AtributoEntidadeNomeJaExisteException(String nome) {
            super("Já existe um atributo com o nome '" + nome + "' nesta entidade.");
        }
    }

    public static class AtributoEntidadeEmUsoException extends RuntimeException {
        public AtributoEntidadeEmUsoException(UUID id) {
            super("O atributo " + id + " é referenciado por registros de impacto e não pode ser removido.");
        }
    }
}
