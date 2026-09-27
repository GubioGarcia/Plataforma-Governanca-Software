package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
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

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Aprovação de requisito (Fase 6) e unicidade do código por projeto. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class RequisitoAprovacaoTest {

    @Autowired private RequisitoService requisitoService;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario dono;
    private Organizacao org;
    private Projeto projeto;
    private Requisito requisito;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        dono = cenario.usuario("dono.aprov@x.com");
        org = cenario.organizacao("Org Aprovação", dono);
        projeto = cenario.projeto("Proj Aprovação", org, dono);
        cenario.statusDeRequisito();
        requisito = cenario.requisito(projeto, dono, "RASCUNHO");
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(dono.getExternalIdentityId().toString());
        AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), grupoOrg(org, "_dono"));
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    @Test
    void aprovar_eReprovar_registramQuemDecidiu() {
        var aprovado = requisitoService.aprovar(jwt, requisito.getId());
        assertThat(aprovado.statusNome()).isEqualTo("APROVADO");
        assertThat(aprovado.aprovadoPorId()).isEqualTo(dono.getId());
        assertThat(aprovado.dataAprovacao()).isNotNull();

        assertThat(requisitoService.reprovar(jwt, requisito.getId()).statusNome()).isEqualTo("REPROVADO");
    }

    @Test
    void stakeholderNaoAprova() {
        AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), grupoOrg(org, "_membros"));
        assertThatThrownBy(() -> requisitoService.aprovar(jwt, requisito.getId())).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> requisitoService.reprovar(jwt, requisito.getId())).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void putECriacao_naoLevamAAprovadoOuReprovado() {
        var aprovado = cenario.statusRequisito("APROVADO", 3);
        var reprovado = cenario.statusRequisito("REPROVADO", 4);

        assertThatThrownBy(() -> requisitoService.atualizar(jwt, requisito.getId(),
                new AtualizarRequisitoRequestDTO(null, null, null, aprovado.getId(), null)))
                .isInstanceOf(RequisitoService.StatusSoPorAprovacaoException.class);
        assertThatThrownBy(() -> requisitoService.criar(jwt, projeto.getId(),
                new CriarRequisitoRequestDTO("R", "d", TipoRequisito.FUNCIONAL, reprovado.getId(), null)))
                .isInstanceOf(RequisitoService.StatusSoPorAprovacaoException.class);
    }

    @Test
    void codigoESequencialPorProjeto_doisProjetosPodemTerREQ001() {
        Projeto outro = cenario.projeto("Outro Proj Aprovação", org, dono);
        var r1 = requisitoService.criar(jwt, outro.getId(), new CriarRequisitoRequestDTO("A", "d", TipoRequisito.FUNCIONAL, null, null));

        assertThat(requisito.getCodigo()).isEqualTo("REQ-001");
        assertThat(r1.codigo()).isEqualTo("REQ-001");
    }
}
