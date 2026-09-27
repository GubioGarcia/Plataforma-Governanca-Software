package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.CriarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.repository.ComentarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.service.ComentarioService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoOperacaoImpacto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.EntidadeDadosService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.ImpactoDadosService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.AtualizarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.OrganizacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service.OrganizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.AtualizarVisaoProdutoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.service.VisaoProdutoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarEventoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.ProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.EventoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.ProjetoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Regras de acesso aplicadas nos services (Fase 4), com quatro perfis sobre a
 * organização A (projetos P1 e P2):
 * <ul>
 *   <li>dono      — /org-A/_dono</li>
 *   <li>membro    — /org-A/_membros (Stakeholder Técnico em todo projeto)</li>
 *   <li>convidado — stakeholder técnico + cliente só no P1</li>
 *   <li>estranho  — Dono de outra organização, sem vínculo com A</li>
 * </ul>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class RegrasDeAcessoIntegracaoTest {

    @Autowired private OrganizacaoService organizacaoService;
    @Autowired private ProjetoService projetoService;
    @Autowired private RequisitoService requisitoService;
    @Autowired private ComentarioService comentarioService;
    @Autowired private EventoService eventoService;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private VisaoProdutoService visaoProdutoService;
    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private ImpactoDadosService impactoDadosService;

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private StatusRequisitoRepository statusRequisitoRepository;
    @Autowired private ComentarioRepository comentarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private UUID keycloakId;
    private Jwt jwtMock;
    private Organizacao orgA, orgB;
    private Projeto p1, p2;

    @BeforeEach
    void setUp() {
        keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Acesso Teste").email("acesso@regras-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        statusRequisitoRepository.save(StatusRequisito.builder().nome("RASCUNHO").descricao("x").ordem(1).build());

        orgA = organizacaoRepository.save(Organizacao.builder().nome("Org A Regras").ativo(true)
                .criadoPor(usuario.getId()).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        orgB = organizacaoRepository.save(Organizacao.builder().nome("Org B Regras").ativo(true)
                .criadoPor(usuario.getId()).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        p1 = salvarProjeto("P1 Regras", orgA, sp, usuario);
        p2 = salvarProjeto("P2 Regras", orgA, sp, usuario);
        visaoProdutoService.inicializarParaProjeto(p1);
        entityManager.flush();
    }

    @AfterEach
    void limparAutenticacao() {
        AutenticacaoTeste.limpar();
    }

    private Projeto salvarProjeto(String nome, Organizacao org, StatusProjeto sp, Usuario usuario) {
        return projetoRepository.save(Projeto.builder().nome(nome).organizacao(org).status(sp)
                .criadoPor(usuario).ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
    }

    // ── Perfis ────────────────────────────────────────────────────────────────

    private void comoDono()      { AutenticacaoTeste.comGrupos(keycloakId, "/org-" + orgA.getId() + "/_dono"); }
    private void comoMembro()    { AutenticacaoTeste.comGrupos(keycloakId, "/org-" + orgA.getId() + "/_membros"); }
    private void comoEstranho()  { AutenticacaoTeste.comGrupos(keycloakId, "/org-" + orgB.getId() + "/_dono"); }
    private void comoConvidadoP1() {
        AutenticacaoTeste.comGrupos(keycloakId,
                AutenticacaoTeste.grupoProjeto(orgA.getId(), p1.getId(), "_stakeholders_tecnicos"),
                AutenticacaoTeste.grupoProjeto(orgA.getId(), p1.getId(), "_stakeholders_clientes"));
    }

    private UUID criarRequisitoComoDono(Projeto projeto) {
        comoDono();
        return requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req " + projeto.getNome(), "desc", TipoRequisito.FUNCIONAL, null, null)).id();
    }

    // ── Organizações ──────────────────────────────────────────────────────────

    @Test
    void organizacoes_listagemMostraSoAsComVinculo() {
        comoEstranho();
        assertThat(organizacaoService.listar(null)).extracting(OrganizacaoResponseDTO::id)
                .contains(orgB.getId()).doesNotContain(orgA.getId());

        comoConvidadoP1(); // convidado a um projeto enxerga a organização dele
        assertThat(organizacaoService.listar(null)).extracting(OrganizacaoResponseDTO::id)
                .containsExactly(orgA.getId());
    }

    @Test
    void organizacoes_semVinculoNaoAcessa_membroNaoEdita_donoEdita() {
        comoEstranho();
        assertThatThrownBy(() -> organizacaoService.buscarPorId(orgA.getId())).isInstanceOf(AcessoNegadoException.class);

        comoMembro();
        var edicao = new AtualizarOrganizacaoRequestDTO("Org A Editada", null, null);
        assertThatThrownBy(() -> organizacaoService.atualizar(orgA.getId(), edicao)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> organizacaoService.inativar(orgA.getId())).isInstanceOf(AcessoNegadoException.class);

        comoDono();
        assertThat(organizacaoService.atualizar(orgA.getId(), edicao).nome()).isEqualTo("Org A Editada");
    }

    @Test
    void organizacoes_gestorInativaMasNaoEdita() { // D14 + D7
        AutenticacaoTeste.comGrupos(keycloakId, "/org-" + orgA.getId() + "/_gestores");

        assertThatThrownBy(() -> organizacaoService.atualizar(orgA.getId(), new AtualizarOrganizacaoRequestDTO("X", null, null)))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatCode(() -> organizacaoService.inativar(orgA.getId())).doesNotThrowAnyException();
    }

    // ── Projetos ──────────────────────────────────────────────────────────────

    @Test
    void projetos_convidadoVeSoOSeuNaOrganizacao_membroVeTodos() {
        comoConvidadoP1();
        assertThat(projetoService.listarPorOrganizacao(orgA.getId(), null)).extracting(ProjetoResponseDTO::id)
                .containsExactly(p1.getId());
        assertThatThrownBy(() -> projetoService.buscarPorId(p2.getId())).isInstanceOf(AcessoNegadoException.class);

        comoMembro();
        assertThat(projetoService.listarPorOrganizacao(orgA.getId(), null)).extracting(ProjetoResponseDTO::id)
                .containsExactlyInAnyOrder(p1.getId(), p2.getId());

        comoEstranho();
        assertThatThrownBy(() -> projetoService.listarPorOrganizacao(orgA.getId(), null)).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void projetos_membroNaoCriaProjetoNemInativa() {
        comoMembro();
        assertThatThrownBy(() -> projetoService.criar(jwtMock, new CriarProjetoRequestDTO(orgA.getId(), "Novo", null)))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> projetoService.inativar(jwtMock, p1.getId())).isInstanceOf(AcessoNegadoException.class);
    }

    // ── Requisitos ────────────────────────────────────────────────────────────

    @Test
    void requisitos_stakeholderLeMasNaoCria_estranhoNaoLe() {
        criarRequisitoComoDono(p1);
        var novo = new CriarRequisitoRequestDTO("R", "d", TipoRequisito.FUNCIONAL, null, null);

        comoMembro();
        assertThat(requisitoService.listarPorProjeto(p1.getId())).hasSize(1);
        assertThatThrownBy(() -> requisitoService.criar(jwtMock, p1.getId(), novo)).isInstanceOf(AcessoNegadoException.class);

        comoConvidadoP1();
        assertThat(requisitoService.listarPorProjeto(p1.getId())).hasSize(1);
        assertThatThrownBy(() -> requisitoService.listarPorProjeto(p2.getId())).isInstanceOf(AcessoNegadoException.class);

        comoEstranho();
        assertThatThrownBy(() -> requisitoService.listarPorProjeto(p1.getId())).isInstanceOf(AcessoNegadoException.class);
    }

    // ── Wiki ──────────────────────────────────────────────────────────────────

    @Test
    void wiki_stakeholderLeMasNaoEdita() {
        var edicao = new AtualizarVisaoProdutoRequestDTO("problema", null, null, null, null, null, null, null, null);

        comoMembro();
        assertThatCode(() -> visaoProdutoService.buscarPorProjetoId(p1.getId())).doesNotThrowAnyException();
        assertThatThrownBy(() -> visaoProdutoService.atualizar(jwtMock, p1.getId(), edicao)).isInstanceOf(AcessoNegadoException.class);

        comoDono();
        assertThatCode(() -> visaoProdutoService.atualizar(jwtMock, p1.getId(), edicao)).doesNotThrowAnyException();
    }

    // ── Comentários ───────────────────────────────────────────────────────────

    @Test
    void comentarios_projetoVemDaEntidade_eNaoDoCorpoDaRequisicao() {
        UUID requisitoP1 = criarRequisitoComoDono(p1);

        comoConvidadoP1();
        // O corpo aponta para P2/org B, mas o comentário é do requisito de P1
        var comentario = comentarioService.criar(jwtMock,
                new CriarComentarioRequestDTO("oi", "REQUISITO", requisitoP1, p2.getId(), orgB.getId()));

        var salvo = comentarioRepository.findById(comentario.id()).orElseThrow();
        assertThat(salvo.getProjeto().getId()).isEqualTo(p1.getId());
        assertThat(salvo.getOrganizacao().getId()).isEqualTo(orgA.getId());
    }

    @Test
    void comentarios_negadoEmProjetoSemParticipacao_eTipoInvalidoRejeitado() {
        UUID requisitoP2 = criarRequisitoComoDono(p2);

        comoConvidadoP1();
        assertThatThrownBy(() -> comentarioService.criar(jwtMock,
                new CriarComentarioRequestDTO("oi", "REQUISITO", requisitoP2, p1.getId(), orgA.getId())))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> comentarioService.listarPorEntidade("REQUISITO", requisitoP2))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> comentarioService.criar(jwtMock,
                new CriarComentarioRequestDTO("oi", "EVENTO", UUID.randomUUID(), null, null)))
                .isInstanceOf(ComentarioService.TipoEntidadeComentarioInvalidoException.class);
    }

    @Test
    void comentarios_listagemGlobalSoParaAdminDaPlataforma() {
        comoDono();
        assertThatThrownBy(comentarioService::listarTodos).isInstanceOf(AcessoNegadoException.class);

        AutenticacaoTeste.comoAdminDaPlataforma(keycloakId);
        assertThatCode(comentarioService::listarTodos).doesNotThrowAnyException();
    }

    // ── Eventos ───────────────────────────────────────────────────────────────

    @Test
    void eventos_organizacaoTemQueSerADoProjeto_eListagemFiltraPorProjeto() {
        comoDono();
        assertThatThrownBy(() -> eventoService.criar(jwtMock, new CriarEventoRequestDTO(
                "Ev", null, p1.getId(), orgB.getId(), Instant.now(), null)))
                .isInstanceOf(EventoService.EventoOrganizacaoInconsistenteException.class);

        eventoService.criar(jwtMock, new CriarEventoRequestDTO("Ev P1", null, p1.getId(), orgA.getId(), Instant.now(), null));
        eventoService.criar(jwtMock, new CriarEventoRequestDTO("Ev P2", null, p2.getId(), orgA.getId(), Instant.now(), null));

        comoConvidadoP1();
        assertThat(eventoService.listarPorOrganizacao(orgA.getId())).extracting(e -> e.nome()).containsExactly("Ev P1");
        assertThatThrownBy(() -> eventoService.criar(jwtMock, new CriarEventoRequestDTO(
                "Ev convidado", null, p1.getId(), orgA.getId(), Instant.now(), null)))
                .isInstanceOf(AcessoNegadoException.class);
    }

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @Test
    void auditoria_stakeholderVeHistoricoDoItemMasNaoATelaCompleta() {
        UUID requisito = criarRequisitoComoDono(p1);

        comoMembro();
        assertThat(auditoriaService.listarPorEntidade("REQUISITO", requisito)).isNotEmpty();
        assertThatThrownBy(() -> auditoriaService.listarPorProjeto(p1.getId(), null)).isInstanceOf(AcessoNegadoException.class);

        comoEstranho();
        assertThatThrownBy(() -> auditoriaService.listarPorEntidade("REQUISITO", requisito)).isInstanceOf(AcessoNegadoException.class);

        comoDono();
        assertThat(auditoriaService.listarPorProjeto(p1.getId(), null)).isNotEmpty();
    }

    // ── Modelagem de dados ────────────────────────────────────────────────────

    @Test
    void impactoDados_requisitoEEntidadeDeProjetosDiferentesERejeitado() {
        UUID requisitoP1 = criarRequisitoComoDono(p1);
        UUID entidadeP2 = entidadeDadosService.criar(jwtMock, p2.getId(), new CriarEntidadeDadosRequestDTO("Cliente", null)).id();

        assertThatThrownBy(() -> impactoDadosService.criar(jwtMock, requisitoP1,
                new CriarImpactoDadosRequestDTO(entidadeP2, null, TipoOperacaoImpacto.CRIA_ENTIDADE, null, null)))
                .isInstanceOf(ImpactoDadosService.ImpactoEntreProjetosDiferentesException.class);
    }

    @Test
    void modelagem_stakeholderVeMasNaoEdita() {
        comoMembro();
        assertThatCode(() -> entidadeDadosService.listarPorProjeto(p1.getId())).doesNotThrowAnyException();
        assertThatThrownBy(() -> entidadeDadosService.criar(jwtMock, p1.getId(), new CriarEntidadeDadosRequestDTO("X", null)))
                .isInstanceOf(AcessoNegadoException.class);
    }
}
