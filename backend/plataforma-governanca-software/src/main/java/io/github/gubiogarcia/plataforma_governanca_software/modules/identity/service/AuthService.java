package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakTokenClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

/**
 * Sessão do usuário (Passo 3.1 do doc de autorização): login por senha, renovação
 * pelo refresh token e logout. O refresh token trafega só no cookie HttpOnly
 * (montado no controller); o access token vai no corpo e fica em memória no front.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final KeycloakTokenClient keycloakTokenClient;
    private final UsuarioService usuarioService;
    private final JwtDecoder jwtDecoder;

    /** Resposta para o corpo + refresh token e sua validade (segundos) para o cookie. */
    public record SessaoAutenticada(LoginResponseDTO resposta, String refreshToken, long refreshExpiresIn) {}

    public SessaoAutenticada login(LoginRequestDTO request) {
        KeycloakTokenClient.Tokens tokens = keycloakTokenClient.autenticar(request.email(), request.senha())
                .orElseThrow(CredenciaisInvalidasException::new);
        return montarSessao(tokens);
    }

    /** Troca o refresh token (cookie) por um access token novo — já com os grupos atuais. */
    public SessaoAutenticada renovar(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new SessaoExpiradaException();
        }
        KeycloakTokenClient.Tokens tokens = keycloakTokenClient.renovar(refreshToken)
                .orElseThrow(SessaoExpiradaException::new);
        return montarSessao(tokens);
    }

    public void logout(String refreshToken) {
        keycloakTokenClient.encerrarSessao(refreshToken);
    }

    private SessaoAutenticada montarSessao(KeycloakTokenClient.Tokens tokens) {
        // Valida com o mesmo decoder do resource server (assinatura, issuer e revogação)
        Jwt jwt = jwtDecoder.decode(tokens.accessToken());
        UsuarioResponseDTO usuario = usuarioService.resolverUsuario(jwt);
        return new SessaoAutenticada(
                new LoginResponseDTO(tokens.accessToken(), tokens.expiresIn(), usuario),
                tokens.refreshToken(),
                tokens.refreshExpiresIn());
    }

    // Exceções de domínio

    public static class CredenciaisInvalidasException extends RuntimeException {
        public CredenciaisInvalidasException() {
            super("E-mail ou senha inválidos.");
        }
    }

    public static class SessaoExpiradaException extends RuntimeException {
        public SessaoExpiradaException() {
            super("Sessão expirada. Faça login novamente.");
        }
    }
}
