package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.AtributoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.RelacionamentoEntidadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
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
 *
 * Quando um atributo é marcado como chave estrangeira, este service deriva e
 * mantém automaticamente o {@link RelacionamentoEntidade} correspondente via
 * {@link RelacionamentoEntidadeService#sincronizarPorAtributo} /
 * {@link RelacionamentoEntidadeService#removerPorAtributo} — não existe tela
 * separada para "criar relacionamento" nesse fluxo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AtributoEntidadeService {

    private final AtributoEntidadeRepository atributoEntidadeRepository;
    private final EntidadeDadosRepository entidadeDadosRepository;
    private final ImpactoDadosRepository impactoDadosRepository;
    private final RelacionamentoEntidadeRepository relacionamentoEntidadeRepository;
    private final RelacionamentoEntidadeService relacionamentoEntidadeService;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final AutorizacaoService autorizacao;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public AtributoEntidadeResponseDTO criar(Jwt jwt, UUID entidadeId, CriarAtributoEntidadeRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);
        EntidadeDados entidade = entidadeDadosRepository.findById(entidadeId)
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId));
        autorizacao.exigir(entidade.getProjeto(), Permissao.MER_EDIT);

        if (atributoEntidadeRepository.existsByEntidadeIdAndNomeIgnoreCase(entidadeId, request.nome())) {
            throw new AtributoEntidadeNomeJaExisteException(request.nome());
        }

        if (Boolean.TRUE.equals(request.chavePrimaria())
                && atributoEntidadeRepository.existsByEntidadeIdAndChavePrimariaTrue(entidadeId)) {
            throw new AtributoEntidadeChavePrimariaJaExisteException(entidadeId);
        }

        boolean chaveEstrangeira = Boolean.TRUE.equals(request.chaveEstrangeira());
        EntidadeDados entidadeReferenciada = chaveEstrangeira
                ? carregarEntidadeReferenciada(request.entidadeReferenciadaId())
                : null;

        AtributoEntidade atributo = AtributoEntidade.builder()
                .entidade(entidade)
                .nome(request.nome())
                .tipo(request.tipo())
                .obrigatorio(request.obrigatorio())
                .chavePrimaria(Boolean.TRUE.equals(request.chavePrimaria()))
                .ordem(request.ordem())
                .chaveEstrangeira(chaveEstrangeira)
                .entidadeReferenciada(entidadeReferenciada)
                .build();

        atributo = atributoEntidadeRepository.save(atributo);
        log.info("AtributoEntidade '{}' criado na entidade {}. ID: {}", atributo.getNome(), entidadeId, atributo.getId());

        Projeto projeto = entidade.getProjeto();
        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ATRIBUTO_ENTIDADE", atributo.getId(), AcaoAuditoria.CRIACAO,
                "nome", null, atributo.getNome()
        );

        RelacionamentoEntidade relacionamento = chaveEstrangeira
                ? relacionamentoEntidadeService.sincronizarPorAtributo(
                        atributo, entidadeReferenciada, tipoOuDefault(request.tipoRelacionamento()))
                : null;

        return mapToResponseDTO(atributo, relacionamento);
    }

    // ── Listar / Buscar ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AtributoEntidadeResponseDTO> listarPorEntidade(UUID entidadeId) {
        EntidadeDados entidade = entidadeDadosRepository.findById(entidadeId)
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeId));
        autorizacao.exigir(entidade.getProjeto(), Permissao.MER_VIEW);

        return atributoEntidadeRepository.findAllByEntidadeIdOrderByOrdemAscNomeAsc(entidadeId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AtributoEntidadeResponseDTO buscarPorId(UUID id) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        autorizacao.exigir(atributo.getEntidade().getProjeto(), Permissao.MER_VIEW);
        return mapToResponseDTO(atributo);
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────

    @Transactional
    public AtributoEntidadeResponseDTO atualizar(Jwt jwt, UUID id, AtualizarAtributoEntidadeRequestDTO request) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        EntidadeDados entidade = atributo.getEntidade();
        Projeto projeto = entidade.getProjeto();
        autorizacao.exigir(projeto, Permissao.MER_EDIT);
        Usuario usuario = resolverUsuario(jwt);

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

        if (request.chavePrimaria() != null && !request.chavePrimaria().equals(atributo.getChavePrimaria())) {
            if (request.chavePrimaria()
                    && atributoEntidadeRepository.existsByEntidadeIdAndChavePrimariaTrueAndIdNot(entidade.getId(), id)) {
                throw new AtributoEntidadeChavePrimariaJaExisteException(entidade.getId());
            }
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EDICAO, "chave_primaria",
                    String.valueOf(atributo.getChavePrimaria()), String.valueOf(request.chavePrimaria())
            );
            atributo.setChavePrimaria(request.chavePrimaria());
        }

        if (request.ordem() != null) {
            atributo.setOrdem(request.ordem());
        }

        RelacionamentoEntidade relacionamento = sincronizarChaveEstrangeira(usuario, projeto, atributo, request);

        atributo = atributoEntidadeRepository.save(atributo);
        log.info("AtributoEntidade {} atualizado.", id);
        return mapToResponseDTO(atributo, relacionamento);
    }

    /**
     * Aplica a mudança de {@code chaveEstrangeira}/{@code entidadeReferenciadaId}/{@code tipoRelacionamento}
     * no atributo e (des)sincroniza o relacionamento derivado. Retorna o relacionamento
     * vigente após a operação (ou {@code null} quando o atributo deixou de ser FK).
     */
    private RelacionamentoEntidade sincronizarChaveEstrangeira(
            Usuario usuario, Projeto projeto, AtributoEntidade atributo, AtualizarAtributoEntidadeRequestDTO request) {

        boolean chaveEstrangeiraAtual = Boolean.TRUE.equals(atributo.getChaveEstrangeira());
        boolean chaveEstrangeiraNova = request.chaveEstrangeira() != null
                ? request.chaveEstrangeira()
                : chaveEstrangeiraAtual;

        UUID entidadeReferenciadaAtualId = atributo.getEntidadeReferenciada() != null
                ? atributo.getEntidadeReferenciada().getId() : null;
        UUID entidadeReferenciadaNovaId = request.entidadeReferenciadaId() != null
                ? request.entidadeReferenciadaId() : entidadeReferenciadaAtualId;

        if (!chaveEstrangeiraNova) {
            if (chaveEstrangeiraAtual) {
                auditoriaService.registrar(
                        usuario, projeto.getOrganizacao(), projeto,
                        "ATRIBUTO_ENTIDADE", atributo.getId(), AcaoAuditoria.EDICAO, "chave_estrangeira", "true", "false"
                );
                relacionamentoEntidadeService.removerPorAtributo(atributo.getId());
            }
            atributo.setChaveEstrangeira(false);
            atributo.setEntidadeReferenciada(null);
            return null;
        }

        EntidadeDados entidadeReferenciada = carregarEntidadeReferenciada(entidadeReferenciadaNovaId);
        boolean mudouReferencia = !entidadeReferenciada.getId().equals(entidadeReferenciadaAtualId);
        if (!chaveEstrangeiraAtual || mudouReferencia) {
            auditoriaService.registrar(
                    usuario, projeto.getOrganizacao(), projeto,
                    "ATRIBUTO_ENTIDADE", atributo.getId(), AcaoAuditoria.EDICAO, "entidade_referenciada",
                    atributo.getEntidadeReferenciada() != null ? atributo.getEntidadeReferenciada().getNome() : null,
                    entidadeReferenciada.getNome()
            );
        }
        atributo.setChaveEstrangeira(true);
        atributo.setEntidadeReferenciada(entidadeReferenciada);

        TipoRelacionamentoEntidade tipo = request.tipoRelacionamento() != null
                ? request.tipoRelacionamento()
                : tipoRelacionamentoVigente(atributo.getId());
        return relacionamentoEntidadeService.sincronizarPorAtributo(atributo, entidadeReferenciada, tipo);
    }

    // ── Deletar (hard delete) ─────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        AtributoEntidade atributo = atributoEntidadeRepository.findById(id)
                .orElseThrow(() -> new AtributoEntidadeNaoEncontradoException(id));
        EntidadeDados entidade = atributo.getEntidade();
        Projeto projeto = entidade.getProjeto();
        autorizacao.exigir(projeto, Permissao.MER_EDIT);
        Usuario usuario = resolverUsuario(jwt);

        if (impactoDadosRepository.existsByAtributoId(id)) {
            throw new AtributoEntidadeEmUsoException(id);
        }

        relacionamentoEntidadeService.removerPorAtributo(id);

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ATRIBUTO_ENTIDADE", id, AcaoAuditoria.EXCLUSAO,
                "nome", atributo.getNome(), null
        );

        atributoEntidadeRepository.deleteById(id);
        log.info("AtributoEntidade {} removido.", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private EntidadeDados carregarEntidadeReferenciada(UUID entidadeReferenciadaId) {
        if (entidadeReferenciadaId == null) {
            throw new EntidadeReferenciadaObrigatoriaException();
        }
        return entidadeDadosRepository.findById(entidadeReferenciadaId)
                .orElseThrow(() -> new EntidadeDadosService.EntidadeDadosNaoEncontradaException(entidadeReferenciadaId));
    }

    private TipoRelacionamentoEntidade tipoOuDefault(TipoRelacionamentoEntidade tipo) {
        return tipo != null ? tipo : TipoRelacionamentoEntidade.UM_PARA_MUITOS;
    }

    private TipoRelacionamentoEntidade tipoRelacionamentoVigente(UUID atributoId) {
        return relacionamentoEntidadeRepository.findByAtributoFkId(atributoId)
                .map(RelacionamentoEntidade::getTipo)
                .orElse(TipoRelacionamentoEntidade.UM_PARA_MUITOS);
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new EntidadeDadosService.UsuarioNaoAutorizadoException(
                        "Usuário autenticado não encontrado na plataforma."));
    }

    private AtributoEntidadeResponseDTO mapToResponseDTO(AtributoEntidade a) {
        RelacionamentoEntidade relacionamento = Boolean.TRUE.equals(a.getChaveEstrangeira())
                ? relacionamentoEntidadeRepository.findByAtributoFkId(a.getId()).orElse(null)
                : null;
        return mapToResponseDTO(a, relacionamento);
    }

    private AtributoEntidadeResponseDTO mapToResponseDTO(AtributoEntidade a, RelacionamentoEntidade relacionamento) {
        return new AtributoEntidadeResponseDTO(
                a.getId(),
                a.getEntidade() != null ? a.getEntidade().getId() : null,
                a.getNome(),
                a.getTipo(),
                a.getObrigatorio(),
                a.getChavePrimaria(),
                a.getOrdem(),
                a.getChaveEstrangeira(),
                a.getEntidadeReferenciada() != null ? a.getEntidadeReferenciada().getId() : null,
                a.getEntidadeReferenciada() != null ? a.getEntidadeReferenciada().getNome() : null,
                relacionamento != null ? relacionamento.getId() : null,
                relacionamento != null ? relacionamento.getTipo() : null
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

    public static class EntidadeReferenciadaObrigatoriaException extends RuntimeException {
        public EntidadeReferenciadaObrigatoriaException() {
            super("Informe a entidade referenciada quando o atributo é uma chave estrangeira.");
        }
    }

    public static class AtributoEntidadeChavePrimariaJaExisteException extends RuntimeException {
        public AtributoEntidadeChavePrimariaJaExisteException(UUID entidadeId) {
            super("A entidade " + entidadeId + " já possui um atributo marcado como chave primária.");
        }
    }
}
