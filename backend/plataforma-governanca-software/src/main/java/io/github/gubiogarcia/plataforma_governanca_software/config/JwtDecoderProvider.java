package io.github.gubiogarcia.plataforma_governanca_software.config;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

public class JwtDecoderProvider {

    private static final NimbusJwtDecoder decoder =
            NimbusJwtDecoder.withJwkSetUri(
                    "http://idprovider_keycloak:8080/realms/plataforma_discovery/protocol/openid-connect/certs"
            ).build();

    public static Jwt decode(String token) {
        return decoder.decode(token);
    }
}
