package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.EstadoPesquisa;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAntesRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaDepoisRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaConfiguracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaParticipacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaRespostaRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pesquisa do TCC (participante): elegibilidade (só Dono ou Gestor), validação
 * das etapas, ordem e unicidade das respostas, retirada e o acesso pela API.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PesquisaServiceTest {

    private static final List<Integer> ITENS = List.of(1, 2, 3, 4, 5);

    @Autowired private PesquisaService service;
    @Autowired private CenarioProjetoTeste cenario;
    @Autowired private PesquisaConfiguracaoRepository configuracaoRepository;
    @Autowired private PesquisaParticipacaoRepository participacaoRepository;
    @Autowired private PesquisaRespostaRepository respostaRepository;
    @Autowired private MockMvc mockMvc;
    @MockitoBean private JwtDecoder jwtDecoder;

    /** Gestor de uma organização qualquer: o público da pesquisa. */
    private static final String GESTOR = "/org-" + UUID.randomUUID() + "/_gestores";

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        configurar(true, 15);
        usuario = cenario.usuario("participante." + UUID.randomUUID() + "@teste.com");
        AutenticacaoTeste.comGrupos(usuario.getExternalIdentityId(), GESTOR);
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void configurar(boolean aberta, int intervalo) {
        configuracaoRepository.save(PesquisaConfiguracao.builder()
                .id(PesquisaConfiguracao.ID).coletaAberta(aberta).intervaloMinimoMin(intervalo)
                .atualizadoEm(Instant.now()).build());
    }

    private static RespostaAntesRequestDTO antes(Boolean consentimento, List<Integer> itens, String aberta) {
        return new RespostaAntesRequestDTO(consentimento, itens, aberta, FuncaoParticipante.DESENVOLVEDOR,
                TempoExperiencia.ATE_5, List.of(Ferramenta.JIRA), null);
    }

    private static RespostaAntesRequestDTO antesValido() {
        return antes(true, ITENS, "  Retrabalho por requisito mal registrado.  ");
    }

    // ─── elegibilidade ───────────────────────────────────────────────────────

    @Test
    void usuarioNovo_comColetaAberta_ficaPendenteAntes() {
        var s = service.situacao();
        assertThat(s.estado()).isEqualTo(EstadoPesquisa.PENDENTE_ANTES);
        assertThat(s.coletaAberta()).isTrue();
        assertThat(s.instrumento().versao()).isEqualTo("v1");
    }

    @Test
    void coletaFechada_naoElegivel_eEnviosDao409() {
        configurar(false, 15);
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.NAO_ELEGIVEL);
        assertThatThrownBy(() -> service.responderAntes(antesValido()))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class).hasMessageContaining("encerrada");
    }

    @Test
    void admin_naoElegivel_eNaoEnvia() {
        AutenticacaoTeste.comoAdminDaPlataforma(usuario.getExternalIdentityId());
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.NAO_ELEGIVEL);
        assertThatThrownBy(() -> service.responderAntes(antesValido())).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.retirar()).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void donoOuGestorDeOrganizacaoOuProjeto_saoElegiveis() {
        UUID org = UUID.randomUUID();
        for (String grupo : List.of("/org-" + org + "/_dono", "/org-" + org + "/_gestores",
                "/org-" + org + "/proj-" + UUID.randomUUID() + "/_gestores",
                "/org-" + org + "/proj-" + UUID.randomUUID() + "/_dono")) {
            AutenticacaoTeste.comGrupos(usuario.getExternalIdentityId(), grupo);
            assertThat(service.situacao().estado()).as(grupo).isEqualTo(EstadoPesquisa.PENDENTE_ANTES);
        }
    }

    @Test
    void semPapelDeDonoOuGestor_naoElegivel_e403NoAntes() {
        UUID org = UUID.randomUUID();
        for (String[] grupos : List.of(new String[]{}, new String[]{"/org-" + org + "/_membros"},
                new String[]{"/org-" + org + "/proj-" + UUID.randomUUID() + "/_stakeholders_clientes"},
                new String[]{"/org-" + org + "/proj-" + UUID.randomUUID() + "/_stakeholders_tecnicos"})) {
            AutenticacaoTeste.comGrupos(usuario.getExternalIdentityId(), grupos);
            assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.NAO_ELEGIVEL);
            assertThatThrownBy(() -> service.responderAntes(antesValido())).isInstanceOf(AcessoNegadoException.class);
        }
    }

    @Test
    void depois_continuaLiberadoParaQuemPerdeuOPapel() {
        configurar(true, 0);
        service.responderAntes(antesValido());
        AutenticacaoTeste.comGrupos(usuario.getExternalIdentityId());   // deixou de ser gestor
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.PENDENTE_DEPOIS);
        assertThat(service.responderDepois(new RespostaDepoisRequestDTO(ITENS, null)).estado())
                .isEqualTo(EstadoPesquisa.CONCLUIDA);
    }

    // ─── etapa "antes" ───────────────────────────────────────────────────────

    @Test
    void antes_geraCodigo_guardaCaracterizacao_eAguardaIntervalo() {
        var s = service.responderAntes(new RespostaAntesRequestDTO(true, ITENS, "  texto  ",
                FuncaoParticipante.GERENTE_PROJETOS, TempoExperiencia.DE_6_A_10, List.of(Ferramenta.JIRA), " Notion "));

        assertThat(s.estado()).isEqualTo(EstadoPesquisa.AGUARDANDO_DEPOIS);
        assertThat(s.codigo()).matches("P-\\d{3,}");
        assertThat(s.depoisDisponivelEm()).isAfter(Instant.now().plusSeconds(14 * 60));

        var p = participacaoRepository.findByUsuarioId(usuario.getId()).orElseThrow();
        assertThat(p.getSituacao()).isEqualTo(SituacaoParticipacao.PARTICIPANDO);
        assertThat(p.getVersaoInstrumento()).isEqualTo("v1");
        assertThat(p.getConsentimentoEm()).isNotNull();
        assertThat(p.getFerramentas()).containsExactlyInAnyOrder(Ferramenta.JIRA, Ferramenta.OUTRA);
        assertThat(p.getFerramentaOutro()).isEqualTo("Notion");
        var r = respostaRepository.findByParticipacaoIdAndEtapa(p.getId(), EtapaPesquisa.ANTES).orElseThrow();
        assertThat(r.itens()).containsExactly((short) 1, (short) 2, (short) 3, (short) 4, (short) 5);
        assertThat(r.getRespostaAberta()).isEqualTo("texto");
    }

    @Test
    void antes_validaConsentimentoItensAbertaECaracterizacao() {
        assertThatThrownBy(() -> service.responderAntes(antes(false, ITENS, null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(antes(null, ITENS, null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(antes(true, List.of(1, 2, 3, 4, 6), null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(antes(true, List.of(0, 2, 3, 4, 5), null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(antes(true, List.of(1, 2, 3, 4), null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(antes(true, ITENS, "x".repeat(2001))))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(new RespostaAntesRequestDTO(true, ITENS, null, null,
                TempoExperiencia.ATE_5, List.of(), null)))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);
        assertThatThrownBy(() -> service.responderAntes(new RespostaAntesRequestDTO(true, ITENS, null,
                FuncaoParticipante.OUTRA, TempoExperiencia.ATE_5, List.of(), "x".repeat(101))))
                .isInstanceOf(PesquisaService.RespostaPesquisaInvalidaException.class);

        assertThat(participacaoRepository.findByUsuarioId(usuario.getId())).isEmpty();
        assertThat(service.responderAntes(antes(true, ITENS, "x".repeat(2000))).estado())
                .isEqualTo(EstadoPesquisa.AGUARDANDO_DEPOIS);
    }

    @Test
    void segundoAntes_da409() {
        service.responderAntes(antesValido());
        assertThatThrownBy(() -> service.responderAntes(antesValido()))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class);
    }

    @Test
    void codigosSaoSequenciais() {
        String primeiro = service.responderAntes(antesValido()).codigo();
        Usuario outro = cenario.usuario("outro." + UUID.randomUUID() + "@teste.com");
        AutenticacaoTeste.comGrupos(outro.getExternalIdentityId(), GESTOR);
        String segundo = service.responderAntes(antesValido()).codigo();

        assertThat(Integer.parseInt(segundo.substring(2))).isEqualTo(Integer.parseInt(primeiro.substring(2)) + 1);
    }

    // ─── etapa "depois" ──────────────────────────────────────────────────────

    @Test
    void depois_semAntes_da409() {
        assertThatThrownBy(() -> service.responderDepois(new RespostaDepoisRequestDTO(ITENS, null)))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class);
    }

    @Test
    void depois_antesDoIntervalo_da409() {
        service.responderAntes(antesValido());
        assertThatThrownBy(() -> service.responderDepois(new RespostaDepoisRequestDTO(ITENS, null)))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class).hasMessageContaining("ainda não");
    }

    @Test
    void depois_comIntervaloCumprido_concluiEUmaVezSo() {
        configurar(true, 0);
        service.responderAntes(antesValido());
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.PENDENTE_DEPOIS);

        var s = service.responderDepois(new RespostaDepoisRequestDTO(List.of(5, 5, 4, 4, 3), "Gostei da matriz."));
        assertThat(s.estado()).isEqualTo(EstadoPesquisa.CONCLUIDA);
        assertThat(s.depoisDisponivelEm()).isNull();
        assertThatThrownBy(() -> service.responderDepois(new RespostaDepoisRequestDTO(ITENS, null)))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class);
    }

    @Test
    void depois_comColetaEncerrada_da409_eSituacaoNaoOferece() {
        configurar(true, 0);
        service.responderAntes(antesValido());
        configurar(false, 0);
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.NAO_ELEGIVEL);
        assertThat(service.situacao().codigo()).isNotNull();
        assertThatThrownBy(() -> service.responderDepois(new RespostaDepoisRequestDTO(ITENS, null)))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class);
    }

    // ─── retirada ────────────────────────────────────────────────────────────

    @Test
    void retirada_apagaRespostasECaracterizacao_eImpedeNovoAntes_mesmoComColetaEncerrada() {
        configurar(true, 0);
        service.responderAntes(antesValido());
        service.responderDepois(new RespostaDepoisRequestDTO(ITENS, "texto"));
        configurar(false, 0);

        var s = service.retirar();
        assertThat(s.estado()).isEqualTo(EstadoPesquisa.RETIRADA);
        var p = participacaoRepository.findByUsuarioId(usuario.getId()).orElseThrow();
        assertThat(p.getCodigo()).isNull();
        assertThat(p.getFuncao()).isNull();
        assertThat(p.getTempoExperiencia()).isNull();
        assertThat(p.getFerramentas()).isEmpty();
        assertThat(respostaRepository.findAllByParticipacaoId(p.getId())).isEmpty();

        configurar(true, 0);
        assertThat(service.situacao().estado()).isEqualTo(EstadoPesquisa.RETIRADA);
        assertThatThrownBy(() -> service.responderAntes(antesValido()))
                .isInstanceOf(PesquisaService.PesquisaConflitoException.class);
        assertThatThrownBy(() -> service.retirar()).isInstanceOf(PesquisaService.PesquisaConflitoException.class);
    }

    // ─── API ─────────────────────────────────────────────────────────────────

    @Test
    void api_semToken401_admin403NosEnvios_semPapel403_gestor200() throws Exception {
        AutenticacaoTeste.limpar();
        mockMvc.perform(get("/api/pesquisa/situacao")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/pesquisa/antes")).andExpect(status().isUnauthorized());

        var admin = jwt().jwt(j -> j.subject(usuario.getExternalIdentityId().toString()).claim("groups", List.of("/_admin")));
        mockMvc.perform(get("/api/pesquisa/situacao").with(admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("NAO_ELEGIVEL"));
        mockMvc.perform(delete("/api/pesquisa/minha-participacao").with(admin)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/pesquisa/antes").with(admin).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());

        var semPapel = jwt().jwt(j -> j.subject(usuario.getExternalIdentityId().toString()).claim("groups", List.of()));
        mockMvc.perform(get("/api/pesquisa/situacao").with(semPapel))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("NAO_ELEGIVEL"));
        mockMvc.perform(post("/api/pesquisa/antes").with(semPapel).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consentimento\":true,\"itens\":[1,2,3,4,5],\"funcao\":\"OUTRA\",\"tempoExperiencia\":\"ATE_5\"}"))
                .andExpect(status().isForbidden());

        var comum = jwt().jwt(j -> j.subject(usuario.getExternalIdentityId().toString()).claim("groups", List.of(GESTOR)));
        mockMvc.perform(get("/api/pesquisa/situacao").with(comum))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PENDENTE_ANTES"))
                .andExpect(jsonPath("$.instrumento.itens.length()").value(5));
        mockMvc.perform(post("/api/pesquisa/antes").with(comum).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consentimento\":false,\"itens\":[1,2,3,4,5],\"funcao\":\"OUTRA\",\"tempoExperiencia\":\"ATE_5\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/pesquisa/antes").with(comum).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consentimento\":true,\"itens\":[1,2,3,4,5],\"funcao\":\"INEXISTENTE\",\"tempoExperiencia\":\"ATE_5\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/pesquisa/antes").with(comum).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consentimento\":true,\"itens\":[1,2,3,4,5],\"funcao\":\"OUTRA\",\"tempoExperiencia\":\"ATE_5\",\"ferramentas\":[\"JIRA\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("AGUARDANDO_DEPOIS"));
        mockMvc.perform(post("/api/pesquisa/antes").with(comum).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"consentimento\":true,\"itens\":[1,2,3,4,5],\"funcao\":\"OUTRA\",\"tempoExperiencia\":\"ATE_5\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/pesquisa/minha-participacao").with(comum))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("RETIRADA"));
    }
}
