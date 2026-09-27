package io.github.gubiogarcia.plataforma_governanca_software.config;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.RevogacaoTokenService;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

/**
 * Recusa (401 invalid_token) tokens emitidos antes da marca de revogação do usuário.
 * O front reage ao 401 renovando a sessão com o refresh token.
 */
public class RevogacaoTokenValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error TOKEN_REVOGADO = new OAuth2Error(
            "invalid_token",
            "As permissões do usuário mudaram; renove a sessão.",
            null);

    private final RevogacaoTokenService revogacaoTokenService;

    public RevogacaoTokenValidator(RevogacaoTokenService revogacaoTokenService) {
        this.revogacaoTokenService = revogacaoTokenService;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        UUID keycloakId;
        try {
            keycloakId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException | NullPointerException ex) {
            return OAuth2TokenValidatorResult.success(); // token sem "sub" de usuário (não é o caso da API)
        }
        return revogacaoTokenService.tokenRevogado(keycloakId, jwt.getIssuedAt())
                ? OAuth2TokenValidatorResult.failure(TOKEN_REVOGADO)
                : OAuth2TokenValidatorResult.success();
    }
}
