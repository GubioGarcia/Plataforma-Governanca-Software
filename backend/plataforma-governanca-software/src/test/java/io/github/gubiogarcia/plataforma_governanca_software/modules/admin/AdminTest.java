package io.github.gubiogarcia.plataforma_governanca_software.modules.admin;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarPrioridadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.PrioridadeService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.StatusRequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Área administrativa (/api/admin/*): só o Admin da Plataforma acessa; o resumo traz
 * só contagens (sem as contas de admin); a auditoria administrativa traz só ações sem
 * organização e sem projeto.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminTest {

    private static final List<String> ROTAS = List.of("/api/admin/resumo", "/api/admin/usuarios", "/api/admin/auditoria");
    private static final UUID GRUPO_ADMIN = UUID.randomUUID();

    @Autowired private MockMvc mockMvc;
    @Autowired private CenarioProjetoTeste cenario;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private StatusRequisitoService statusRequisitoService;
    @Autowired private PrioridadeService prioridadeService;
    @Autowired private AuditoriaService auditoriaService;
    @MockitoBean private JwtDecoder jwtDecoder;
    @MockitoBean private KeycloakAdminClient keycloakAdminClient;

    private Usuario admin;

    @BeforeEach
    void setUp() {
        admin = cenario.usuario("admin.area@teste.com");
        when(keycloakAdminClient.buscarGrupoPorCaminho("/_admin")).thenReturn(Optional.of(GRUPO_ADMIN));
        when(keycloakAdminClient.listarMembros(GRUPO_ADMIN)).thenReturn(List.of(admin.getExternalIdentityId()));
    }

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequestBuilder comoAdmin(MockHttpServletRequestBuilder req) {
        return req.with(jwt().jwt(j -> j.subject(admin.getExternalIdentityId().toString()).claim("groups", List.of("/_admin"))));
    }

    private void autenticarServicoComoAdmin() {
        Jwt token = Jwt.withTokenValue("t").header("alg", "none")
                .subject(admin.getExternalIdentityId().toString()).claim("groups", List.of("/_admin")).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token));
    }

    // ─── acesso ──────────────────────────────────────────────────────────────

    @Test
    void semToken_retorna401() throws Exception {
        for (String rota : ROTAS) {
            mockMvc.perform(get(rota)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void usuarioComum_retorna403() throws Exception {
        for (String rota : ROTAS) {
            mockMvc.perform(get(rota).with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()).claim("groups", List.of()))))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void donoDeOrganizacaoEGestor_retornam403() throws Exception {
        Organizacao org = cenario.organizacao("Org Admin Teste", admin);
        Projeto projeto = cenario.projeto("Projeto Admin Teste", org, admin);
        List<String> grupos = List.of("/org-" + org.getId() + "/_dono", "/org-" + org.getId() + "/_gestores",
                "/org-" + org.getId() + "/proj-" + projeto.getId() + "/_gestores");
        for (String grupo : grupos) {
            for (String rota : ROTAS) {
                mockMvc.perform(get(rota).with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()).claim("groups", List.of(grupo)))))
                        .andExpect(status().isForbidden());
            }
        }
    }

    @Test
    void admin_retorna200() throws Exception {
        for (String rota : ROTAS) {
            mockMvc.perform(comoAdmin(get(rota))).andExpect(status().isOk());
        }
    }

    @Test
    void parametroInvalido_retorna400SemDetalhesInternos() throws Exception {
        mockMvc.perform(comoAdmin(get("/api/admin/auditoria").param("acao", "QUALQUER")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/parametro-invalido"))
                .andExpect(jsonPath("$.detail").value("O parametro 'acao' esta ausente ou tem um valor invalido."));
    }

    // ─── conteúdo ────────────────────────────────────────────────────────────

    @Test
    void resumo_contaUsuariosSemAsContasDeAdmin() throws Exception {
        cenario.usuario("comum.area@teste.com");
        Usuario inativo = cenario.usuario("inativo.area@teste.com");
        inativo.setAtivo(false);
        usuarioRepository.save(inativo);
        long ativos = usuarioRepository.findAll().stream().filter(Usuario::getAtivo).count() - 1; // menos o admin

        mockMvc.perform(comoAdmin(get("/api/admin/resumo")))
                .andExpect(jsonPath("$.usuariosAtivos").value(ativos))
                .andExpect(jsonPath("$.usuariosInativos").value(1))
                .andExpect(jsonPath("$.requisitosPorStatus").isMap());
    }

    @Test
    void usuarios_buscaPorNomeOuEmail_eMarcaAdminEPropriaConta() throws Exception {
        cenario.usuario("fulana.area@teste.com");

        mockMvc.perform(comoAdmin(get("/api/admin/usuarios").param("busca", "AREA@TESTE").param("tamanho", "1")))
                .andExpect(jsonPath("$.itens.length()").value(1))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.totalPaginas").value(2));

        mockMvc.perform(comoAdmin(get("/api/admin/usuarios").param("busca", "admin.area")))
                .andExpect(jsonPath("$.itens[0].adminPlataforma").value(true))
                .andExpect(jsonPath("$.itens[0].propria").value(true));

        mockMvc.perform(comoAdmin(get("/api/admin/usuarios").param("busca", "fulana.area")))
                .andExpect(jsonPath("$.itens[0].adminPlataforma").value(false))
                .andExpect(jsonPath("$.itens[0].propria").value(false));
    }

    @Test
    void dadosDeReferencia_geramAuditoriaAdministrativa_eSoElaApareceNaListagem() {
        autenticarServicoComoAdmin();
        var status = statusRequisitoService.criar(new CriarStatusRequisitoRequestDTO("EM_TESTE_ADMIN", "Teste", 77));
        prioridadeService.criar(new CriarPrioridadeRequestDTO("URGENTE_ADMIN", "Urgente", null, 78));
        statusRequisitoService.deletar(status.id());

        var pagina = auditoriaService.listarAdministrativa(0, 100, null, null, null);
        assertThat(pagina.itens()).allSatisfy(a -> {
            assertThat(a.organizacaoId()).isNull();
            assertThat(a.projetoId()).isNull();
        });
        assertThat(pagina.itens()).extracting(a -> a.entidadeTipo() + ":" + a.acao() + ":" + a.campoAlterado())
                .contains("STATUS_REQUISITO:CRIACAO:nome", "STATUS_REQUISITO:EXCLUSAO:nome", "PRIORIDADE:CRIACAO:codigo");
        assertThat(pagina.itens()).allSatisfy(a -> assertThat(a.usuarioId()).isEqualTo(admin.getId()));

        var soExclusoes = auditoriaService.listarAdministrativa(0, 100, AcaoAuditoria.EXCLUSAO, null, null);
        assertThat(soExclusoes.itens()).isNotEmpty().allSatisfy(a -> assertThat(a.acao()).isEqualTo(AcaoAuditoria.EXCLUSAO));

        var noFuturo = auditoriaService.listarAdministrativa(0, 100, null, Instant.now().plusSeconds(3600), null);
        assertThat(noFuturo.itens()).isEmpty();
    }
}
