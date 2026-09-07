package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.AtributoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.ImpactoDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.ImpactoDadosPorEntidadeDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.ImpactoDadosResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Peça central do Ponto 2B do estudo: liga um Requisito a uma
 * EntidadeDados/AtributoEntidade e guarda o diff antes/depois. Também é a base
 * do vínculo INDIRETO da matriz de rastreabilidade (Ponto 1B).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImpactoDadosService {

    private final ImpactoDadosRepository impactoDadosRepository;
    private final RequisitoRepository requisitoRepository;
    private final EntidadeDadosRepository entidadeDadosRepository;
    private final AtributoEntidadeRepository atributoEntidadeRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public ImpactoDadosResponseDTO criar(Jwt jwt, UUID requisitoId, CriarImpactoDadosRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);
        Requisito requisito = requisitoRepository.findById(requisitoId)
                .orElseThrow(() -> new RequisitoService.RequisitoNaoEncontradoException(requisitoId));
        EntidadeDados entidade = entidadeDadosRepository.findById(request.entidadeId())
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(request.entidadeId()));

        AtributoEntidade atributo = resolverAtributo(request.atributoId(), entidade.getId());

        ImpactoDados impacto = ImpactoDados.builder()
                .requisito(requisito)
                .entidade(entidade)
                .atributo(atributo)
                .tipoOperacao(request.tipoOperacao())
                .valorAnterior(request.valorAnterior())
                .valorNovo(request.valorNovo())
                .criadoPor(usuario)
                .dataCriacao(Instant.now())
                .build();

        impacto = impactoDadosRepository.save(impacto);
        log.info("ImpactoDados {} criado: requisito {} -> entidade {} ({}).",
                impacto.getId(), requisito.getCodigo(), entidade.getNome(), request.tipoOperacao());

        String alvo = atributo != null ? entidade.getNome() + "." + atributo.getNome() : entidade.getNome();

        // Auditoria do próprio registro de impacto
        auditoriaService.registrar(
                usuario, requisito.getProjeto().getOrganizacao(), requisito.getProjeto(),
                "IMPACTO_DADOS", impacto.getId(), AcaoAuditoria.CRIACAO,
                "impacto", null, request.tipoOperacao() + " em " + alvo
        );
        // Auditoria no requisito pai — reaproveita o serviço existente (estudo §2 / MER_V2)
        auditoriaService.registrar(
                usuario, requisito.getProjeto().getOrganizacao(), requisito.getProjeto(),
                "REQUISITO", requisitoId, AcaoAuditoria.EDICAO,
                "impacto_dados", null, request.tipoOperacao() + " em " + alvo
        );
        interacaoService.registrar(usuario, requisito.getProjeto(), ModuloInteracao.MODELAGEM_DADOS,
                TipoInteracao.CRIACAO, requisitoId, "Impacto em dados registrado (" + requisito.getCodigo() + "): " + alvo);

        return mapToResponseDTO(impacto);
    }

    // ── Listar / Buscar ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ImpactoDadosResponseDTO> listarPorRequisito(UUID requisitoId) {
        if (!requisitoRepository.existsById(requisitoId)) {
            throw new RequisitoService.RequisitoNaoEncontradoException(requisitoId);
        }
        return impactoDadosRepository.findAllByRequisitoIdOrderByEntidadeNomeAscDataCriacaoAsc(requisitoId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    /**
     * Alterações do requisito agrupadas por entidade — base da visão
     * "estado atual vs. proposto" na tela do requisito.
     */
    @Transactional(readOnly = true)
    public List<ImpactoDadosPorEntidadeDTO> listarPorRequisitoAgrupado(UUID requisitoId) {
        if (!requisitoRepository.existsById(requisitoId)) {
            throw new RequisitoService.RequisitoNaoEncontradoException(requisitoId);
        }
        Map<UUID, List<ImpactoDadosResponseDTO>> porEntidade = new LinkedHashMap<>();
        Map<UUID, String> nomeEntidade = new LinkedHashMap<>();
        for (ImpactoDados i : impactoDadosRepository.findAllByRequisitoIdOrderByEntidadeNomeAscDataCriacaoAsc(requisitoId)) {
            UUID eid = i.getEntidade().getId();
            nomeEntidade.putIfAbsent(eid, i.getEntidade().getNome());
            porEntidade.computeIfAbsent(eid, k -> new ArrayList<>()).add(mapToResponseDTO(i));
        }
        List<ImpactoDadosPorEntidadeDTO> resultado = new ArrayList<>();
        porEntidade.forEach((eid, alteracoes) ->
                resultado.add(new ImpactoDadosPorEntidadeDTO(eid, nomeEntidade.get(eid), alteracoes)));
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<ImpactoDadosResponseDTO> listarPorEntidade(UUID entidadeId) {
        if (!entidadeDadosRepository.existsById(entidadeId)) {
            throw new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId);
        }
        return impactoDadosRepository.findAllByEntidadeId(entidadeId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ImpactoDadosResponseDTO buscarPorId(UUID id) {
        return mapToResponseDTO(carregar(id));
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public ImpactoDadosResponseDTO atualizar(Jwt jwt, UUID id, AtualizarImpactoDadosRequestDTO request) {
        ImpactoDados impacto = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Requisito requisito = impacto.getRequisito();

        if (request.atributoId() != null) {
            AtributoEntidade atributo = resolverAtributo(request.atributoId(), impacto.getEntidade().getId());
            impacto.setAtributo(atributo);
        }
        if (request.tipoOperacao() != null && !request.tipoOperacao().equals(impacto.getTipoOperacao())) {
            auditoriaService.registrar(
                    usuario, requisito.getProjeto().getOrganizacao(), requisito.getProjeto(),
                    "IMPACTO_DADOS", id, AcaoAuditoria.EDICAO, "tipo_operacao",
                    impacto.getTipoOperacao().name(), request.tipoOperacao().name()
            );
            impacto.setTipoOperacao(request.tipoOperacao());
        }
        if (request.valorAnterior() != null) impacto.setValorAnterior(request.valorAnterior());
        if (request.valorNovo() != null) impacto.setValorNovo(request.valorNovo());

        impacto = impactoDadosRepository.save(impacto);
        log.info("ImpactoDados {} atualizado.", id);
        return mapToResponseDTO(impacto);
    }

    // ── Deletar (hard delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        ImpactoDados impacto = carregar(id);
        Usuario usuario = resolverUsuario(jwt);
        Requisito requisito = impacto.getRequisito();
        String alvo = impacto.getAtributo() != null
                ? impacto.getEntidade().getNome() + "." + impacto.getAtributo().getNome()
                : impacto.getEntidade().getNome();

        auditoriaService.registrar(
                usuario, requisito.getProjeto().getOrganizacao(), requisito.getProjeto(),
                "IMPACTO_DADOS", id, AcaoAuditoria.EXCLUSAO,
                "impacto", impacto.getTipoOperacao() + " em " + alvo, null
        );

        impactoDadosRepository.deleteById(id);
        log.info("ImpactoDados {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AtributoEntidade resolverAtributo(UUID atributoId, UUID entidadeId) {
        if (atributoId == null) return null;
        AtributoEntidade atributo = atributoEntidadeRepository.findById(atributoId)
                .orElseThrow(() -> new AtributoEntidadeService.AtributoEntidadeNaoEncontradoException(atributoId));
        if (!atributo.getEntidade().getId().equals(entidadeId)) {
            throw new AtributoNaoPertenceAEntidadeException(atributoId, entidadeId);
        }
        return atributo;
    }

    private ImpactoDados carregar(UUID id) {
        return impactoDadosRepository.findById(id)
                .orElseThrow(() -> new ImpactoDadosNaoEncontradoException(id));
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new RequisitoService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private ImpactoDadosResponseDTO mapToResponseDTO(ImpactoDados i) {
        return new ImpactoDadosResponseDTO(
                i.getId(),
                i.getRequisito() != null ? i.getRequisito().getId() : null,
                i.getRequisito() != null ? i.getRequisito().getCodigo() : null,
                i.getRequisito() != null ? i.getRequisito().getTitulo() : null,
                i.getEntidade() != null ? i.getEntidade().getId() : null,
                i.getEntidade() != null ? i.getEntidade().getNome() : null,
                i.getAtributo() != null ? i.getAtributo().getId() : null,
                i.getAtributo() != null ? i.getAtributo().getNome() : null,
                i.getTipoOperacao(),
                i.getValorAnterior(),
                i.getValorNovo(),
                i.getCriadoPor() != null ? i.getCriadoPor().getId() : null,
                i.getCriadoPor() != null ? i.getCriadoPor().getNome() : null,
                i.getDataCriacao()
        );
    }

    // ── Domain Exceptions ─────────────────────────────────────────────────────

    public static class ImpactoDadosNaoEncontradoException extends RuntimeException {
        public ImpactoDadosNaoEncontradoException(UUID id) {
            super("Registro de impacto em dados não encontrado com o id: " + id);
        }
    }

    public static class AtributoNaoPertenceAEntidadeException extends RuntimeException {
        public AtributoNaoPertenceAEntidadeException(UUID atributoId, UUID entidadeId) {
            super("O atributo " + atributoId + " não pertence à entidade " + entidadeId + ".");
        }
    }
}
