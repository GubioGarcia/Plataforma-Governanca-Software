package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.MeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoProj;
import static org.assertj.core.api.Assertions.*;

/** GET /api/auth/me: o mapa de acesso que o front usa para montar a tela. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class MeServiceTest {

    @Autowired private MeService service;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario dono, convidado;
    private Organizacao org;
    private Projeto alfa, beta;

    @BeforeEach
    void setUp() {
        dono = cenario.usuario("dono.me@x.com");
        convidado = cenario.usuario("convidado.me@x.com");
        org = cenario.organizacao("Org Me", dono);
        beta = cenario.projeto("Beta", org, dono);
        alfa = cenario.projeto("alfa", org, dono);
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private MeResponseDTO me() {
        return service.montar((Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void dono_veTodosOsProjetosDaOrganizacao_ordenadosPorNome() {
        AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), grupoOrg(org, "_dono"));
        MeResponseDTO me = me();

        assertThat(me.adminPlataforma()).isFalse();
        assertThat(me.organizacoes()).singleElement().satisfies(o -> {
            assertThat(o.papel()).isEqualTo(PapelOrganizacao.DONO);
            assertThat(o.permissoes()).contains(Permissao.ORG_DELETE);
            assertThat(o.projetos()).extracting(MeResponseDTO.ProjetoAcesso::nome).containsExactly("alfa", "Beta");
            assertThat(o.projetos()).allSatisfy(p -> assertThat(p.papeis()).containsExactly(PapelProjeto.DONO));
        });
    }

    @Test
    void membro_herdaStakeholderTecnicoEmTodosOsProjetos() {
        AutenticacaoTeste.comGrupos(convidado.getExternalIdentityId(), grupoOrg(org, "_membros"));
        var o = me().organizacoes().getFirst();

        assertThat(o.papel()).isEqualTo(PapelOrganizacao.MEMBRO);
        assertThat(o.projetos()).hasSize(2)
                .allSatisfy(p -> assertThat(p.papeis()).containsExactly(PapelProjeto.STAKEHOLDER_TECNICO));
    }

    @Test
    void convidado_veSoOProjetoEmQueEsta_semPapelNaOrganizacao() {
        AutenticacaoTeste.comGrupos(convidado.getExternalIdentityId(),
                grupoProj(alfa, "_stakeholders_tecnicos"), grupoProj(alfa, "_stakeholders_clientes"));
        var o = me().organizacoes().getFirst();

        assertThat(o.papel()).isNull();
        assertThat(o.projetos()).singleElement().satisfies(p -> {
            assertThat(p.id()).isEqualTo(alfa.getId());
            assertThat(p.papeis()).containsExactlyInAnyOrder(PapelProjeto.STAKEHOLDER_TECNICO, PapelProjeto.STAKEHOLDER_CLIENTE);
            assertThat(p.permissoes()).contains(Permissao.REQ_REQUEST_APPROVAL).doesNotContain(Permissao.REQ_APPROVE);
        });
    }

    @Test
    void semVinculo_listaVazia_eAdminSoSinalizaAdmin() {
        AutenticacaoTeste.comGrupos(convidado.getExternalIdentityId());
        assertThat(me().organizacoes()).isEmpty();

        AutenticacaoTeste.comoAdminDaPlataforma(convidado.getExternalIdentityId());
        MeResponseDTO me = me();
        assertThat(me.adminPlataforma()).isTrue();
        assertThat(me.email()).isEqualTo("convidado.me@x.com");
    }
}
