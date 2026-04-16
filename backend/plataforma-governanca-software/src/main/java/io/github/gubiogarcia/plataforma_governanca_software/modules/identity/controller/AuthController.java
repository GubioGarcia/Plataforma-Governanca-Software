package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.LoginRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.LoginResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.AuthService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(usuarioService.resolverUsuario(jwt));
    }
}