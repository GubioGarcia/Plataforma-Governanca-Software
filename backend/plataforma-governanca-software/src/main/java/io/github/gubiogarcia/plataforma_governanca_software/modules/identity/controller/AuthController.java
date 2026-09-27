package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.LoginRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.LoginResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.MeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.AuthService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.MeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/**
 * POST /api/auth/login   — e-mail + senha → access token (corpo) + refresh token (cookie HttpOnly)
 * POST /api/auth/refresh — cookie → access token novo (com os grupos atuais) + cookie renovado
 * POST /api/auth/logout  — encerra a sessão no Keycloak e apaga o cookie
 * GET  /api/auth/me      — usuário + organizações/projetos com papéis e permissões
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final MeService meService;
    private final CookieSessao cookieSessao;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request) {
        return comCookie(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = CookieSessao.NOME, required = false) String refreshToken) {
        try {
            return comCookie(authService.renovar(refreshToken));
        } catch (AuthService.SessaoExpiradaException ex) {
            // Sessão acabou: apaga o cookie e o front manda para o login
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
            problem.setTitle("Sessao expirada");
            problem.setType(URI.create("/errors/sessao-expirada"));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, cookieSessao.remover())
                    .body(problem);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = CookieSessao.NOME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieSessao.remover())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(meService.montar(jwt));
    }

    private ResponseEntity<LoginResponseDTO> comCookie(AuthService.SessaoAutenticada sessao) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieSessao.criar(sessao.refreshToken(), sessao.refreshExpiresIn()))
                .body(sessao.resposta());
    }
}
