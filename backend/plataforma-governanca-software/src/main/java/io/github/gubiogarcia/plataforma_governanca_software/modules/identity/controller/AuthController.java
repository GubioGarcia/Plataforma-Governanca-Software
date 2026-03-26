package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    /**
     * O frontend chama este endpoint com o Bearer token no header.
     * O Spring Security valida o JWT automaticamente antes de entrar aqui.
     * O @AuthenticationPrincipal injeta o JWT já decodificado.
     */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> me(@AuthenticationPrincipal Jwt jwt) {
        UsuarioResponseDTO usuario = usuarioService.resolverUsuario(jwt);
        return ResponseEntity.ok(usuario);
    }
}