package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.ConfiguracaoPesquisaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAntesRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaDepoisRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaConfiguracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Painel da pesquisa: acesso só do Admin, contagens e estatística descritiva,
 * configuração auditada e CSV anonimizado e protegido contra fórmulas.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminPesquisaTest {

    private static final List<String> ROTAS = List.of("/api/admin/pesquisa/resumo",
            "/api/admin/pesquisa/respostas-abertas", "/api/admin/pesquisa/exportacao");

    @Autowired private AdminPesquisaService adminService;
    @Autowired private PesquisaService pesquisaService;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private CenarioProjetoTeste cenario;
    @Autowired private PesquisaConfiguracaoRepository configuracaoRepository;
    @Autowired private MockMvc mockMvc;
    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario admin;

    @BeforeEach
    void setUp() {
        configuracaoRepository.save(PesquisaConfiguracao.builder().id(PesquisaConfiguracao.ID)
                .coletaAberta(true).intervaloMinimoMin(0).atualizadoEm(Instant.now()).build());
        admin = cenario.usuario("admin.pesquisa." + UUID.randomUUID() + "@teste.com");
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void comoAdmin() {
        AutenticacaoTeste.comoAdminDaPlataforma(admin.getExternalIdentityId());
    }

    /** Participante que responde o "antes" e, se depois != null, o "depois". */
    private Usuario participante(List<Integer> antes, List<Integer> depois, String abertaAntes) {
        Usuario u = cenario.usuario("p." + UUID.randomUUID() + "@teste.com");
        AutenticacaoTeste.comGrupos(u.getExternalIdentityId(), "/org-" + UUID.randomUUID() + "/_dono");
        pesquisaService.responderAntes(new RespostaAntesRequestDTO(true, antes, abertaAntes,
                FuncaoParticipante.ANALISTA_REQUISITOS, TempoExperiencia.DE_11_A_15, List.of(Ferramenta.JIRA, Ferramenta.CONFLUENCE), null));
        if (depois != null) pesquisaService.responderDepois(new RespostaDepoisRequestDTO(depois, null));
        return u;
    }

    // ─── acesso ──────────────────────────────────────────────────────────────

    @Test
    void semToken401_usuarioComum403_admin200() throws Exception {
        for (String rota : ROTAS) {
            mockMvc.perform(get(rota)).andExpect(status().isUnauthorized());
            mockMvc.perform(get(rota).with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()).claim("groups", List.of()))))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get(rota).with(jwt().jwt(j -> j.subject(admin.getExternalIdentityId().toString())
                    .claim("groups", List.of("/_admin"))))).andExpect(status().isOk());
        }
        mockMvc.perform(put("/api/admin/pesquisa/configuracao").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"coletaAberta\":true,\"intervaloMinimoMin\":5}")
                        .with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()).claim("groups", List.of()))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/pesquisa/exportacao").with(jwt().jwt(j -> j.subject(admin.getExternalIdentityId().toString())
                        .claim("groups", List.of("/_admin")))))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("pesquisa-tcc-respostas.csv")));
    }

    @Test
    void servicoRecusaQuemNaoEAdmin() {
        AutenticacaoTeste.comGrupos(admin.getExternalIdentityId());
        assertThatThrownBy(() -> adminService.resumo()).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> adminService.exportar()).isInstanceOf(AcessoNegadoException.class);
    }

    // ─── resumo ──────────────────────────────────────────────────────────────

    @Test
    void resumo_contaEtapas_eCalculaMedianaEPareamento() {
        participante(List.of(1, 2, 3, 4, 5), List.of(3, 2, 1, 4, 5), null);
        participante(List.of(2, 2, 3, 4, 5), List.of(4, 4, 3, 4, 5), null);
        participante(List.of(5, 2, 3, 4, 5), null, null);

        comoAdmin();
        var r = adminService.resumo();
        assertThat(r.participantes()).isEqualTo(3);
        assertThat(r.antesRespondidos()).isEqualTo(3);
        assertThat(r.depoisRespondidos()).isEqualTo(2);
        assertThat(r.paresCompletos()).isEqualTo(2);

        var item1 = r.itens().get(0);
        assertThat(item1.antes().n()).isEqualTo(3);
        assertThat(item1.antes().distribuicao()).containsExactly(1, 1, 0, 0, 1);
        assertThat(item1.antes().mediana()).isEqualTo(2.0);
        assertThat(item1.depois().mediana()).isEqualTo(3.5);
        assertThat(item1.pareado().n()).isEqualTo(2);
        assertThat(item1.pareado().medianaDiferenca()).isEqualTo(2.0);
        assertThat(item1.pareado().melhoraram()).isEqualTo(2);

        var item3 = r.itens().get(2);
        assertThat(item3.pareado().pioraram()).isEqualTo(1);
        assertThat(item3.pareado().iguais()).isEqualTo(1);

        assertThat(r.funcoes()).anySatisfy(c -> {
            assertThat(c.valor()).isEqualTo("ANALISTA_REQUISITOS");
            assertThat(c.quantidade()).isEqualTo(3);
        });
        assertThat(r.ferramentas()).filteredOn(c -> c.valor().equals("JIRA")).singleElement()
                .extracting(c -> c.quantidade()).isEqualTo(3L);
    }

    @Test
    void mediana_comQuantidadeParEImpar_eSemValores() {
        assertThat(AdminPesquisaService.mediana(List.of(3, 1, 2))).isEqualTo(2.0);
        assertThat(AdminPesquisaService.mediana(List.of(4, 1, 2, 3))).isEqualTo(2.5);
        assertThat(AdminPesquisaService.mediana(List.of())).isNull();
        assertThat(AdminPesquisaService.distribuicao(List.of()).mediana()).isNull();
    }

    @Test
    void respostasAbertas_soComCodigo_semNomeNemEmail() {
        participante(List.of(1, 1, 1, 1, 1), null, "Perdemos uma semana por falta de registro.");
        comoAdmin();
        var pagina = adminService.respostasAbertas(EtapaPesquisa.ANTES, 0, 20);
        assertThat(pagina.itens()).singleElement().satisfies(a -> {
            assertThat(a.codigo()).startsWith("P-");
            assertThat(a.texto()).isEqualTo("Perdemos uma semana por falta de registro.");
        });
        assertThat(adminService.respostasAbertas(EtapaPesquisa.DEPOIS, 0, 20).itens()).isEmpty();
    }

    // ─── configuração ────────────────────────────────────────────────────────

    @Test
    void configurar_abreEncerraEAudita_eValidaIntervalo() {
        comoAdmin();
        assertThatThrownBy(() -> adminService.configurar(new ConfiguracaoPesquisaRequestDTO(true, 1441)))
                .isInstanceOf(AdminPesquisaService.ConfiguracaoPesquisaInvalidaException.class);
        assertThatThrownBy(() -> adminService.configurar(new ConfiguracaoPesquisaRequestDTO(null, 10)))
                .isInstanceOf(AdminPesquisaService.ConfiguracaoPesquisaInvalidaException.class);

        var r = adminService.configurar(new ConfiguracaoPesquisaRequestDTO(false, 30));
        assertThat(r.coletaAberta()).isFalse();
        assertThat(r.encerradaEm()).isNotNull();
        assertThat(r.intervaloMinimoMin()).isEqualTo(30);
        r = adminService.configurar(new ConfiguracaoPesquisaRequestDTO(true, 30));
        assertThat(r.coletaAberta()).isTrue();
        assertThat(r.abertaEm()).isNotNull();

        var trilha = auditoriaService.listarAdministrativa(0, 100, null, null, null).itens().stream()
                .filter(a -> "PESQUISA".equals(a.entidadeTipo())).toList();
        assertThat(trilha).extracting(a -> a.campoAlterado() + ":" + a.valorNovo())
                .contains("coleta:Encerrada", "coleta:Aberta", "intervaloMinimo:30 min");
        assertThat(trilha).allSatisfy(a -> assertThat(a.usuarioId()).isEqualTo(admin.getId()));
    }

    // ─── exportação ──────────────────────────────────────────────────────────

    @Test
    void exportar_umaLinhaPorParticipante_semEmail_comFormulaNeutralizada_eAuditado() {
        Usuario u = participante(List.of(1, 2, 3, 4, 5), List.of(5, 4, 3, 2, 1), "=HYPERLINK(\"http://x\")");
        Usuario retirou = participante(List.of(3, 3, 3, 3, 3), null, null);
        AutenticacaoTeste.comGrupos(retirou.getExternalIdentityId());
        pesquisaService.retirar();

        comoAdmin();
        var arquivo = adminService.exportar();
        String csv = new String(arquivo.conteudo(), StandardCharsets.UTF_8);
        String[] linhas = csv.substring(1).split("\r\n");

        assertThat(arquivo.linhas()).isEqualTo(1);
        assertThat(linhas).hasSize(2);
        assertThat(linhas[0]).startsWith("codigo;versao;funcao;tempo_experiencia;ferramentas;ferramenta_outro;antes_em;antes_i1;")
                .endsWith(";depois_i5;depois_aberta");
        assertThat(linhas[1]).startsWith("P-").contains(";v1;ANALISTA_REQUISITOS;DE_11_A_15;CONFLUENCE|JIRA;;")
                .contains(";1;2;3;4;5;\"'=HYPERLINK(\"\"http://x\"\")\";").endsWith(";5;4;3;2;1;");
        assertThat(csv).doesNotContain(u.getEmail()).doesNotContain(u.getNome()).doesNotContain("@");

        assertThat(auditoriaService.listarAdministrativa(0, 100, null, null, null).itens())
                .anySatisfy(a -> {
                    assertThat(a.entidadeTipo()).isEqualTo("PESQUISA");
                    assertThat(a.campoAlterado()).isEqualTo("exportacaoCsv");
                    assertThat(a.valorNovo()).isEqualTo("1 linha(s)");
                });
    }
}
