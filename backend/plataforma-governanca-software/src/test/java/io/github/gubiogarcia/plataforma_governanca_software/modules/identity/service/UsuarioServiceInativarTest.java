package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** DELETE /api/usuario/{id}: só o próprio usuário ou o Admin da Plataforma (grupo /_admin). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class UsuarioServiceInativarTest {

    @Autowired private UsuarioService usuarioService;
    @Autowired private UsuarioRepository usuarioRepository;

    @MockitoBean private JwtDecoder jwtDecoder;
    @MockitoBean private KeycloakAdminClient keycloakAdminClient;

    private Usuario ana;
    private Usuario bruno;

    @BeforeEach
    void setUp() {
        ana   = salvar("ana.inativar@exemplo.com");
        bruno = salvar("bruno.inativar@exemplo.com");
    }

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    private Usuario salvar(String email) {
        return usuarioRepository.save(Usuario.builder()
                .externalIdentityId(UUID.randomUUID())
                .nome(email)
                .email(email)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());
    }

    private void autenticarComo(Usuario usuario, List<String> grupos) {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "none")
                .subject(usuario.getExternalIdentityId().toString())
                .claim("groups", grupos)
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @Test
    void usuario_podeInativarAPropriaConta() {
        autenticarComo(ana, List.of());

        usuarioService.inativar(ana.getId());

        verify(keycloakAdminClient).desabilitarUsuario(ana.getExternalIdentityId());
        assertThat(usuarioRepository.findById(ana.getId()).orElseThrow().getAtivo()).isFalse();
    }

    @Test
    void usuario_naoPodeInativarContaDeOutro() {
        autenticarComo(ana, List.of("/org-" + UUID.randomUUID() + "/_dono"));

        assertThatThrownBy(() -> usuarioService.inativar(bruno.getId()))
                .isInstanceOf(AcessoNegadoException.class);
        verifyNoInteractions(keycloakAdminClient);
        assertThat(usuarioRepository.findById(bruno.getId()).orElseThrow().getAtivo()).isTrue();
    }

    @Test
    void adminDaPlataforma_podeInativarContaDeOutro() {
        autenticarComo(ana, List.of("/_admin"));

        usuarioService.inativar(bruno.getId());

        verify(keycloakAdminClient).desabilitarUsuario(bruno.getExternalIdentityId());
    }
}
