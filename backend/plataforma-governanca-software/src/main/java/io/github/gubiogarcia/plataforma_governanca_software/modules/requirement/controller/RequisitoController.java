package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.RequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
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
@RequestMapping("/api/requisito")
@RequiredArgsConstructor
public class RequisitoController {

    private final RequisitoService requisitoService;

    @PostMapping("/projeto/{projetoId}")
    public ResponseEntity<RequisitoResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projetoId,
            @Valid @RequestBody CriarRequisitoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(requisitoService.criar(jwt, projetoId, request));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<RequisitoResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(requisitoService.listarPorProjeto(projetoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequisitoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(requisitoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequisitoResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestBody AtualizarRequisitoRequestDTO request) {
        return ResponseEntity.ok(requisitoService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        requisitoService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
