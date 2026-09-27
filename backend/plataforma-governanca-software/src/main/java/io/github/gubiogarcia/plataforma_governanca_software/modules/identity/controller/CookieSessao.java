package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cookie do refresh token: HttpOnly (JavaScript não lê), SameSite=Strict e restrito
 * ao caminho /api/auth — só é enviado para login/refresh/logout.
 * Secure deve ficar ligado em produção (HTTPS); em dev local (HTTP) fica desligado.
 */
@Component
public class CookieSessao {

    public static final String NOME = "plataforma_refresh";
    private static final String CAMINHO = "/api/auth";

    private final boolean seguro;

    public CookieSessao(@Value("${plataforma.auth.cookie-seguro:false}") boolean seguro) {
        this.seguro = seguro;
    }

    public String criar(String refreshToken, long validadeSegundos) {
        return base(refreshToken).maxAge(Duration.ofSeconds(validadeSegundos)).build().toString();
    }

    public String remover() {
        return base("").maxAge(Duration.ZERO).build().toString();
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {
        return ResponseCookie.from(NOME, valor)
                .httpOnly(true)
                .secure(seguro)
                .sameSite("Strict")
                .path(CAMINHO);
    }
}
