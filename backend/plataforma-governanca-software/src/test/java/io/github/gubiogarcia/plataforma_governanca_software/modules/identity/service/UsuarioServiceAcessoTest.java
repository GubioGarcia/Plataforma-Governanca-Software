package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
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

import static org.assertj.core.api.Assertions.*;

/** Contas de usuário: listagem/busca global só para o Admin; ver uma conta, só ela mesma ou o Admin. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class UsuarioServiceAcessoTest {

    @Autowired private UsuarioService service;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario ana, bruno;

    @BeforeEach
    void setUp() {
        ana = cenario.usuario("ana.acesso@x.com");
        bruno = cenario.usuario("bruno.acesso@x.com");
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    @Test
    void usuarioComum_naoListaNemBusca() {
        AutenticacaoTeste.comGrupos(ana.getExternalIdentityId());
        assertThatThrownBy(() -> service.listarTodos(null)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.buscarPorEmail("bruno.acesso@x.com")).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.buscarPorNome("bruno")).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void admin_listaEBusca() {
        AutenticacaoTeste.comoAdminDaPlataforma(ana.getExternalIdentityId());
        assertThat(service.listarTodos(true)).extracting("email").contains("ana.acesso@x.com", "bruno.acesso@x.com");
        assertThat(service.buscarPorEmail("bruno.acesso@x.com").id()).isEqualTo(bruno.getId());
        assertThat(service.buscarPorNome("bruno.acesso")).hasSize(1);
    }

    @Test
    void buscarPorId_soProprioOuAdmin() {
        AutenticacaoTeste.comGrupos(ana.getExternalIdentityId());
        assertThat(service.buscarPorId(ana.getId()).email()).isEqualTo("ana.acesso@x.com");
        assertThatThrownBy(() -> service.buscarPorId(bruno.getId())).isInstanceOf(AcessoNegadoException.class);

        AutenticacaoTeste.comoAdminDaPlataforma(ana.getExternalIdentityId());
        assertThat(service.buscarPorId(bruno.getId()).email()).isEqualTo("bruno.acesso@x.com");
    }
}
