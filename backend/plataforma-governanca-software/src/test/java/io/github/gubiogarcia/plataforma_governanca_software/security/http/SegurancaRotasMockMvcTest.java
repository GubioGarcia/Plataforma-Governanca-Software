package io.github.gubiogarcia.plataforma_governanca_software.security.http;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Garante pela camada HTTP que as rotas realmente bloqueiam: 401 sem token (ou com token
 * inválido) e 403 para quem está autenticado mas sem grupo no projeto.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SegurancaRotasMockMvcTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private CenarioProjetoTeste cenario;
    @MockitoBean private JwtDecoder jwtDecoder;

    @Test
    void rotaProtegida_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/organizacao"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rotaProtegida_comTokenInvalido_retorna401() throws Exception {
        when(jwtDecoder.decode(anyString())).thenThrow(new BadJwtException("assinatura inválida"));

        mockMvc.perform(get("/api/organizacao").header("Authorization", "Bearer token-falso"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requisitosDoProjeto_semGrupoNoProjeto_retorna403() throws Exception {
        Usuario dono = cenario.usuario("dono-http@teste.com");
        Organizacao org = cenario.organizacao("Org HTTP", dono);
        Projeto projeto = cenario.projeto("Projeto HTTP", org, dono);

        mockMvc.perform(get("/api/requisito/projeto/{id}", projeto.getId())
                        .with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()).claim("groups", List.of()))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("/errors/acesso-negado"));
    }

    @Test
    void requisitosDoProjeto_comGrupoDeDono_naoRetorna403() throws Exception {
        Usuario dono = cenario.usuario("dono-http2@teste.com");
        Organizacao org = cenario.organizacao("Org HTTP 2", dono);
        Projeto projeto = cenario.projeto("Projeto HTTP 2", org, dono);

        mockMvc.perform(get("/api/requisito/projeto/{id}", projeto.getId())
                        .with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString())
                                .claim("groups", List.of("/org-" + org.getId() + "/_dono")))))
                .andExpect(status().isOk());
    }
}
