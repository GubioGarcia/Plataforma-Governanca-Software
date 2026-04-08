package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AlterarSenhaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AtualizarPerfilRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.CadastroUsuarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos(
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(usuarioService.listarTodos(ativo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @GetMapping("/email")
    public ResponseEntity<UsuarioResponseDTO> buscarPorEmail(
            @RequestParam String email) {
        return ResponseEntity.ok(usuarioService.buscarPorEmail(email));
    }

    @GetMapping("/nome")
    public ResponseEntity<List<UsuarioResponseDTO>> buscarPorNome(
            @RequestParam String nome) {
        return ResponseEntity.ok(usuarioService.buscarPorNome(nome));
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<UsuarioResponseDTO> cadastrar(@Valid @RequestBody CadastroUsuarioRequestDTO request) {
        UsuarioResponseDTO usuario = usuarioService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @PutMapping("/atualizar")
    public ResponseEntity<UsuarioResponseDTO> atualizarPerfil(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AtualizarPerfilRequestDTO request) {
        UsuarioResponseDTO usuario = usuarioService.atualizarPerfil(jwt, request);
        return ResponseEntity.ok(usuario);
    }

    @PatchMapping("/alterarSenha")
    public ResponseEntity<Void> alterarSenha(@Valid @RequestBody AlterarSenhaRequestDTO request) {
        usuarioService.alterarSenha(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        usuarioService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}