package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.config.RevogacaoTokenValidator;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.LoginRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakTokenClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakTokenClient.Tokens;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Sessão (Fase 5): login, refresh e a espera pelo segundo seguinte quando o token cai na marca de revogação. */
class AuthServiceTest {

    private KeycloakTokenClient tokenClient;
    private UsuarioService usuarioService;
    private JwtDecoder decoder;
    private AuthService service;

    private final Tokens tokens = new Tokens("access-1", 1800, "refresh-1", 1800);
    private final Jwt jwt = Jwt.withTokenValue("access").header("alg", "none").subject(UUID.randomUUID().toString()).build();
    private final UsuarioResponseDTO usuario = new UsuarioResponseDTO(
            UUID.randomUUID(), UUID.randomUUID(), "Ana", "ana@x.com", true, null, null, List.of());

    @BeforeEach
    void setUp() {
        tokenClient = mock(KeycloakTokenClient.class);
        usuarioService = mock(UsuarioService.class);
        decoder = mock(JwtDecoder.class);
        service = new AuthService(tokenClient, usuarioService, decoder);
        when(usuarioService.resolverUsuario(any())).thenReturn(usuario);
    }

    @Test
    void login_devolveAccessNoCorpo_eRefreshParaOCookie() {
        when(tokenClient.autenticar("ana@x.com", "senha")).thenReturn(Optional.of(tokens));
        when(decoder.decode("access-1")).thenReturn(jwt);

        var sessao = service.login(new LoginRequestDTO("ana@x.com", "senha"));

        assertThat(sessao.resposta().token()).isEqualTo("access-1");
        assertThat(sessao.resposta().expiresIn()).isEqualTo(1800);
        assertThat(sessao.resposta().user()).isEqualTo(usuario);
        assertThat(sessao.refreshToken()).isEqualTo("refresh-1");
    }

    @Test
    void login_comCredenciaisRecusadas_lancaCredenciaisInvalidas() {
        when(tokenClient.autenticar(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequestDTO("ana@x.com", "errada")))
                .isInstanceOf(AuthService.CredenciaisInvalidasException.class);
    }

    @Test
    void renovar_semCookieOuComRefreshInvalido_lancaSessaoExpirada() {
        assertThatThrownBy(() -> service.renovar(null)).isInstanceOf(AuthService.SessaoExpiradaException.class);
        assertThatThrownBy(() -> service.renovar(" ")).isInstanceOf(AuthService.SessaoExpiradaException.class);

        when(tokenClient.renovar("velho")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.renovar("velho")).isInstanceOf(AuthService.SessaoExpiradaException.class);
    }

    @Test
    void renovar_quandoTokenNovoCaiNaMarcaDeRevogacao_esperaERenovaDeNovo() {
        Tokens segundo = new Tokens("access-2", 1800, "refresh-2", 1800);
        when(tokenClient.renovar("refresh-0")).thenReturn(Optional.of(tokens));
        when(tokenClient.renovar("refresh-1")).thenReturn(Optional.of(segundo));
        when(decoder.decode("access-1")).thenThrow(new JwtValidationException("revogado",
                List.of(new OAuth2Error("invalid_token", RevogacaoTokenValidator.DESCRICAO_TOKEN_REVOGADO, null))));
        when(decoder.decode("access-2")).thenReturn(jwt);

        long inicio = System.currentTimeMillis();
        var sessao = service.renovar("refresh-0");

        assertThat(sessao.resposta().token()).isEqualTo("access-2");
        assertThat(sessao.refreshToken()).isEqualTo("refresh-2");
        assertThat(System.currentTimeMillis() - inicio).isGreaterThanOrEqualTo(40);   // esperou o segundo virar
    }

    @Test
    void outroErroDeValidacaoDoToken_naoERetentado() {
        when(tokenClient.autenticar(any(), any())).thenReturn(Optional.of(tokens));
        when(decoder.decode("access-1")).thenThrow(new JwtValidationException("issuer",
                List.of(new OAuth2Error("invalid_token", "issuer inválido", null))));

        assertThatThrownBy(() -> service.login(new LoginRequestDTO("ana@x.com", "senha")))
                .isInstanceOf(JwtValidationException.class);
        verify(tokenClient, never()).renovar(any());
    }

    @Test
    void logout_encerraASessaoNoKeycloak() {
        service.logout("refresh-1");
        verify(tokenClient).encerrarSessao("refresh-1");
    }
}
