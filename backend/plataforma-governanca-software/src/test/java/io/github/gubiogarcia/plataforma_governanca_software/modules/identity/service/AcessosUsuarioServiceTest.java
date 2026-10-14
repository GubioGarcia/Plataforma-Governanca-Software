package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AcessosUsuarioDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoProj;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** GET /api/usuario/{id}/acessos: papéis reais de outra pessoa, a partir dos grupos dela no Keycloak. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class AcessosUsuarioServiceTest {

    @Autowired private AcessosUsuarioService service;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;
    @MockitoBean private KeycloakAdminClient keycloakAdminClient;

    private Usuario admin, pessoa;
    private Organizacao fatesg, outra;
    private Projeto alfa, beta, gama;

    @BeforeEach
    void setUp() {
        admin  = cenario.usuario("admin.acessos@x.com");
        pessoa = cenario.usuario("pessoa.acessos@x.com");
        fatesg = cenario.organizacao("Fatesg", admin);
        outra  = cenario.organizacao("Outra", admin);
        beta = cenario.projeto("Beta", fatesg, admin);
        alfa = cenario.projeto("alfa", fatesg, admin);
        gama = cenario.projeto("Gama", outra, admin);
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void gruposDaPessoa(String... caminhos) {
        when(keycloakAdminClient.listarGruposDoUsuario(pessoa.getExternalIdentityId())).thenReturn(
                Arrays.stream(caminhos).map(c -> new KeycloakAdminClient.GrupoDoUsuario(UUID.randomUUID(), c)).toList());
    }

    @Test
    void quemNaoEAdmin_naoVeAcessosDeOutraPessoa() {
        AutenticacaoTeste.comoDonoDaOrganizacao(admin.getExternalIdentityId(), fatesg.getId());

        assertThatThrownBy(() -> service.acessosDe(pessoa.getId())).isInstanceOf(AcessoNegadoException.class);
        verifyNoInteractions(keycloakAdminClient);
    }

    @Test
    void papelNaOrganizacao_valeEmTodosOsProjetos_eConviteSoNoProjeto() {
        AutenticacaoTeste.comoAdminDaPlataforma(admin.getExternalIdentityId());
        gruposDaPessoa(
                grupoOrg(fatesg, "_gestores"),
                grupoProj(alfa, "_stakeholders_clientes"),
                grupoProj(gama, "_stakeholders_tecnicos"),
                "/_admin");

        AcessosUsuarioDTO acessos = service.acessosDe(pessoa.getId());

        assertThat(acessos.organizacoes()).extracting(AcessosUsuarioDTO.OrganizacaoAcesso::nome)
                .containsExactly("Fatesg", "Outra");

        var naFatesg = acessos.organizacoes().get(0);
        assertThat(naFatesg.papel()).isEqualTo(PapelOrganizacao.GESTOR);
        assertThat(naFatesg.projetos()).extracting(AcessosUsuarioDTO.ProjetoAcesso::nome).containsExactly("alfa", "Beta");
        assertThat(naFatesg.projetos().get(0).papeis())
                .containsExactlyInAnyOrder(PapelProjeto.GESTOR, PapelProjeto.STAKEHOLDER_CLIENTE);
        assertThat(naFatesg.projetos().get(1).papeis()).containsExactly(PapelProjeto.GESTOR);

        // Sem papel na organização: só o projeto para o qual foi convidada
        var naOutra = acessos.organizacoes().get(1);
        assertThat(naOutra.papel()).isNull();
        assertThat(naOutra.projetos()).singleElement().satisfies(p -> {
            assertThat(p.nome()).isEqualTo("Gama");
            assertThat(p.papeis()).containsExactly(PapelProjeto.STAKEHOLDER_TECNICO);
        });
    }

    @Test
    void semGrupos_naoAtuaEmNenhumLugar() {
        AutenticacaoTeste.comoAdminDaPlataforma(admin.getExternalIdentityId());
        gruposDaPessoa();

        assertThat(service.acessosDe(pessoa.getId()).organizacoes()).isEmpty();
    }
}
