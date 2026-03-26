package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/users")
public class UsuarioController {
    @GetMapping("/me")
    public String me(@AuthenticationPrincipal Jwt jwt) {
        return jwt.getSubject(); // ID do usuário no Keycloak
    }
}