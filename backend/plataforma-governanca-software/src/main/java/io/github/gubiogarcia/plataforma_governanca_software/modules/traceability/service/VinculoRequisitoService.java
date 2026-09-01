package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.VinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.AtualizarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CriarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.VinculoRequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository.VinculoRequisitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Camada de vínculo DIRETO da matriz de rastreabilidade (Ponto 1A/1B do
 * estudo): auto-relacionamento N:N entre requisitos, criado manualmente.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VinculoRequisitoService {

    private final VinculoRequisitoRepository vinculoRequisitoRepository;
    private final RequisitoRepository requisitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public VinculoRequisitoResponseDTO criar(Jwt jwt, UUID requisitoOrigemId, CriarVinculoRequisitoRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        if (requisitoOrigemId.equals(request.requisitoDestinoId())) {
            throw new VinculoRequisitoReflexivoException();
        }

        Requisito origem = requisitoRepository.findById(requisitoOrigemId)
                .orElseThrow(() -> new RequisitoService.RequisitoNaoEncontradoException(requisitoOrigemId));
        Requisito destino = requisitoRepository.findById(request.requisitoDestinoId())
                .orElseThrow(() -> new RequisitoService.RequisitoNaoEncontradoException(request.requisitoDestinoId()));

        if (!origem.getProjeto().getId().equals(destino.getProjeto().getId())) {
            throw new RequisitosDeProjetosDiferentesException();
        }
        if (vinculoRequisitoRepository.existsByRequisitoOrigemIdAndRequisitoDestinoIdAndTipo(
                requisitoOrigemId, request.requisitoDestinoId(), request.tipo())) {
            throw new VinculoRequisitoDuplicadoException();
        }

        VinculoRequisito vinculo = VinculoRequisito.builder()
                .requisitoOrigem(origem)
                .requisitoDestino(destino)
                .tipo(request.tipo())
                .build();

        vinculo = vinculoRequisitoRepository.save(vinculo);
        log.info("VinculoRequisito {} criado: {} {} {}.",
                vinculo.getId(), origem.getCodigo(), request.tipo(), destino.getCodigo());

        String descricao = origem.getCodigo() + " " + request.tipo() + " " + destino.getCodigo();
        auditoriaService.registrar(
                usuario, origem.getProjeto().getOrganizacao(), origem.getProjeto(),
                "VINCULO_REQUISITO", vinculo.getId(), AcaoAuditoria.CRIACAO,
                "vinculo", null, descricao
        );
        auditoriaService.registrar(
                usuario, origem.getProjeto().getOrganizacao(), origem.getProjeto(),
                "REQUISITO", requisitoOrigemId, AcaoAuditoria.EDICAO,
                "vinculo_requisito", null, descricao
        );
        interacaoService.registrar(usuario, origem.getProjeto(), ModuloInteracao.RASTREABILIDADE,
                TipoInteracao.CRIACAO, vinculo.getId(), "Vínculo criado: " + descricao);

        return mapToResponseDTO(vinculo, requisitoOrigemId);
    }

    // ── Listar / Buscar ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VinculoRequisitoResponseDTO> listarPorRequisito(UUID requisitoId) {
        if (!requisitoRepository.existsById(requisitoId)) {
            throw new RequisitoService.RequisitoNaoEncontradoException(requisitoId);
        }
        return vinculoRequisitoRepository
                .findAllByRequisitoOrigemIdOrRequisitoDestinoId(requisitoId, requisitoId).stream()
                .map(v -> mapToResponseDTO(v, requisitoId))
                .toList();
    }

    @Transactional(readOnly = true)
    public VinculoRequisitoResponseDTO buscarPorId(UUID id) {
        VinculoRequisito vinculo = carregar(id);
        return mapToResponseDTO(vinculo, vinculo.getRequisitoOrigem().getId());
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public VinculoRequisitoResponseDTO atualizar(Jwt jwt, UUID id, AtualizarVinculoRequisitoRequestDTO request) {
        VinculoRequisito vinculo = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Requisito origem = vinculo.getRequisitoOrigem();

        if (!request.tipo().equals(vinculo.getTipo())) {
            if (vinculoRequisitoRepository.existsByRequisitoOrigemIdAndRequisitoDestinoIdAndTipo(
                    origem.getId(), vinculo.getRequisitoDestino().getId(), request.tipo())) {
                throw new VinculoRequisitoDuplicadoException();
            }
            auditoriaService.registrar(
                    usuario, origem.getProjeto().getOrganizacao(), origem.getProjeto(),
                    "VINCULO_REQUISITO", id, AcaoAuditoria.EDICAO, "tipo",
                    vinculo.getTipo().name(), request.tipo().name()
            );
            vinculo.setTipo(request.tipo());
        }

        vinculo = vinculoRequisitoRepository.save(vinculo);
        log.info("VinculoRequisito {} atualizado.", id);
        return mapToResponseDTO(vinculo, origem.getId());
    }

    // ── Deletar (hard delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        VinculoRequisito vinculo = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Requisito origem = vinculo.getRequisitoOrigem();
        String descricao = origem.getCodigo() + " " + vinculo.getTipo() + " " + vinculo.getRequisitoDestino().getCodigo();

        auditoriaService.registrar(
                usuario, origem.getProjeto().getOrganizacao(), origem.getProjeto(),
                "VINCULO_REQUISITO", id, AcaoAuditoria.EXCLUSAO,
                "vinculo", descricao, null
        );

        vinculoRequisitoRepository.deleteById(id);
        log.info("VinculoRequisito {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private VinculoRequisito carregar(UUID id) {
        return vinculoRequisitoRepository.findById(id)
                .orElseThrow(() -> new VinculoRequisitoNaoEncontradoException(id));
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new RequisitoService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private VinculoRequisitoResponseDTO mapToResponseDTO(VinculoRequisito v, UUID perspectivaRequisitoId) {
        String sentido = null;
        if (v.getRequisitoOrigem().getId().equals(perspectivaRequisitoId)) {
            sentido = "SAIDA";
        } else if (v.getRequisitoDestino().getId().equals(perspectivaRequisitoId)) {
            sentido = "ENTRADA";
        }
        return new VinculoRequisitoResponseDTO(
                v.getId(),
                v.getRequisitoOrigem().getId(),
                v.getRequisitoOrigem().getCodigo(),
                v.getRequisitoOrigem().getTitulo(),
                v.getRequisitoDestino().getId(),
                v.getRequisitoDestino().getCodigo(),
                v.getRequisitoDestino().getTitulo(),
                v.getTipo(),
                sentido
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class VinculoRequisitoNaoEncontradoException extends RuntimeException {
        public VinculoRequisitoNaoEncontradoException(UUID id) {
            super("Vínculo de requisito não encontrado com o id: " + id);
        }
    }

    public static class VinculoRequisitoDuplicadoException extends RuntimeException {
        public VinculoRequisitoDuplicadoException() {
            super("Já existe um vínculo entre esses requisitos com o mesmo tipo.");
        }
    }

    public static class VinculoRequisitoReflexivoException extends RuntimeException {
        public VinculoRequisitoReflexivoException() {
            super("Um requisito não pode ser vinculado a ele mesmo.");
        }
    }

    public static class RequisitosDeProjetosDiferentesException extends RuntimeException {
        public RequisitosDeProjetosDiferentesException() {
            super("Os requisitos de origem e destino pertencem a projetos diferentes.");
        }
    }
}
