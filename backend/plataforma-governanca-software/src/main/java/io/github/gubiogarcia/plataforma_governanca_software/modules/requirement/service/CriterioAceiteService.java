package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.CriterioAceite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarCriterioAceiteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarCriterioAceiteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriterioAceiteResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.CriterioAceiteRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
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
public class CriterioAceiteService {

    private final CriterioAceiteRepository criterioAceiteRepository;
    private final RequisitoRepository       requisitoRepository;
    private final UsuarioRepository         usuarioRepository;
    private final AuditoriaService          auditoriaService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public CriterioAceiteResponseDTO criar(Jwt jwt, UUID requisitoId, CriarCriterioAceiteRequestDTO request) {
        Usuario  usuario  = resolverUsuario(jwt);
        Requisito requisito = requisitoRepository.findById(requisitoId)
                .orElseThrow(() -> new RequisitoService.RequisitoNaoEncontradoException(requisitoId));

        CriterioAceite criterio = CriterioAceite.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .criadoPor(usuario)
                .requisito(requisito)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        criterio = criterioAceiteRepository.save(criterio);
        log.info("CriterioAceite '{}' criado para requisito {}. ID: {}",
                criterio.getNome(), requisitoId, criterio.getId());

        // Auditoria: registra criação de critério no requisito pai
        auditoriaService.registrar(
                usuario,
                null,
                requisito.getProjeto(),
                "REQUISITO",
                requisitoId,
                AcaoAuditoria.CRIACAO,
                "criterio_aceite",
                null,
                request.nome()
        );

        return mapToResponseDTO(criterio);
    }

    // ── Listar ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CriterioAceiteResponseDTO> listarPorRequisito(UUID requisitoId) {
        if (!requisitoRepository.existsById(requisitoId)) {
            throw new RequisitoService.RequisitoNaoEncontradoException(requisitoId);
        }
        return criterioAceiteRepository
                .findAllByRequisitoIdOrderByDataCriacaoAsc(requisitoId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CriterioAceiteResponseDTO buscarPorId(UUID id) {
        CriterioAceite criterio = criterioAceiteRepository.findById(id)
                .orElseThrow(() -> new CriterioAceiteNaoEncontradoException(id));
        return mapToResponseDTO(criterio);
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public CriterioAceiteResponseDTO atualizar(Jwt jwt, UUID id, AtualizarCriterioAceiteRequestDTO request) {
        CriterioAceite criterio  = criterioAceiteRepository.findById(id)
                .orElseThrow(() -> new CriterioAceiteNaoEncontradoException(id));
        Usuario        usuario   = resolverUsuario(jwt);
        Requisito      requisito = criterio.getRequisito();

        // Auditoria por campo
        if (request.nome() != null && !request.nome().equals(criterio.getNome())) {
            auditoriaService.registrar(
                    usuario, null, requisito.getProjeto(),
                    "REQUISITO", requisito.getId(),
                    AcaoAuditoria.EDICAO,
                    "criterio_aceite",
                    criterio.getNome(),
                    request.nome()
            );
        }

        if (request.descricao() != null && !request.descricao().equals(criterio.getDescricao())) {
            auditoriaService.registrar(
                    usuario, null, requisito.getProjeto(),
                    "REQUISITO", requisito.getId(),
                    AcaoAuditoria.EDICAO,
                    "criterio_aceite_descricao",
                    criterio.getDescricao(),
                    request.descricao()
            );
        }

        criterio.setNome(request.nome());
        criterio.setDescricao(request.descricao());
        criterio.setDataAtualizacao(Instant.now());

        criterio = criterioAceiteRepository.save(criterio);
        log.info("CriterioAceite {} atualizado.", id);
        return mapToResponseDTO(criterio);
    }

    // ── Deletar ───────────────────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        CriterioAceite criterio  = criterioAceiteRepository.findById(id)
                .orElseThrow(() -> new CriterioAceiteNaoEncontradoException(id));
        Usuario        usuario   = resolverUsuario(jwt);
        Requisito      requisito = criterio.getRequisito();

        // Auditoria: remoção do critério
        auditoriaService.registrar(
                usuario, null, requisito.getProjeto(),
                "REQUISITO", requisito.getId(),
                AcaoAuditoria.EXCLUSAO,
                "criterio_aceite",
                criterio.getNome(),
                null
        );

        criterioAceiteRepository.deleteById(id);
        log.info("CriterioAceite {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new RequisitoService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private CriterioAceiteResponseDTO mapToResponseDTO(CriterioAceite c) {
        return new CriterioAceiteResponseDTO(
                c.getId(),
                c.getNome(),
                c.getDescricao(),
                c.getRequisito().getId(),
                c.getCriadoPor() != null ? c.getCriadoPor().getNome() : null,
                c.getCriadoPor() != null ? c.getCriadoPor().getId()   : null,
                c.getDataCriacao(),
                c.getDataAtualizacao()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class CriterioAceiteNaoEncontradoException extends RuntimeException {
        public CriterioAceiteNaoEncontradoException(UUID id) {
            super("Critério de aceite não encontrado com o id: " + id);
        }
    }
}
