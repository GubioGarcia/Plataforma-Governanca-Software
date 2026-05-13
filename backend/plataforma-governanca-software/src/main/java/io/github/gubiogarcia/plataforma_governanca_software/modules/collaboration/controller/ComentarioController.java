package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.AtualizarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.ComentarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.CriarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.service.ComentarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de comentário — genérico para qualquer entidade do sistema.
 *
 * GET    /api/comentario?entidadeTipo=REQUISITO&entidadeId={uuid}  — lista thread
 * POST   /api/comentario                                            — cria comentário
 * PATCH  /api/comentario/{id}                                       — edita conteúdo (só autor)
 * DELETE /api/comentario/{id}                                       — soft-delete (só autor, sem posterior)
 */
@RestController
@RequestMapping("/api/comentario")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioService comentarioService;

    @GetMapping("/todos")
    public ResponseEntity<List<ComentarioResponseDTO>> listarTodos() {
        return ResponseEntity.ok(comentarioService.listarTodos());
    }

    @GetMapping
    public ResponseEntity<List<ComentarioResponseDTO>> listar(
            @RequestParam String entidadeTipo,
            @RequestParam UUID   entidadeId
    ) {
        return ResponseEntity.ok(comentarioService.listarPorEntidade(entidadeTipo, entidadeId));
    }

    @PostMapping
    public ResponseEntity<ComentarioResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarComentarioRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comentarioService.criar(jwt, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ComentarioResponseDTO> editar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarComentarioRequestDTO request
    ) {
        return ResponseEntity.ok(comentarioService.editar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id
    ) {
        comentarioService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
