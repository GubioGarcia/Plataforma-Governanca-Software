package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.AtualizarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CriarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.VinculoRequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service.VinculoRequisitoService;
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
@RequestMapping("/api/vinculo-requisito")
@RequiredArgsConstructor
public class VinculoRequisitoController {

    private final VinculoRequisitoService vinculoRequisitoService;

    @PostMapping("/requisito/{requisitoId}")
    public ResponseEntity<VinculoRequisitoResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID requisitoId,
            @Valid @RequestBody CriarVinculoRequisitoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vinculoRequisitoService.criar(jwt, requisitoId, request));
    }

    @GetMapping("/requisito/{requisitoId}")
    public ResponseEntity<List<VinculoRequisitoResponseDTO>> listarPorRequisito(@PathVariable UUID requisitoId) {
        return ResponseEntity.ok(vinculoRequisitoService.listarPorRequisito(requisitoId));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<VinculoRequisitoResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(vinculoRequisitoService.listarPorProjeto(projetoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VinculoRequisitoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(vinculoRequisitoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VinculoRequisitoResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarVinculoRequisitoRequestDTO request) {
        return ResponseEntity.ok(vinculoRequisitoService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        vinculoRequisitoService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
