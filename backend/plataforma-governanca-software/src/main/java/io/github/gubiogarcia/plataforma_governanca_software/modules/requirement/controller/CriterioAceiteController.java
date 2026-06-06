package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarCriterioAceiteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarCriterioAceiteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriterioAceiteResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.CriterioAceiteService;
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
@RequestMapping("/api/criterio-aceite")
@RequiredArgsConstructor
public class CriterioAceiteController {

    private final CriterioAceiteService criterioAceiteService;

    @PostMapping("/requisito/{requisitoId}")
    public ResponseEntity<CriterioAceiteResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID requisitoId,
            @Valid @RequestBody CriarCriterioAceiteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(criterioAceiteService.criar(jwt, requisitoId, request));
    }

    @GetMapping("/requisito/{requisitoId}")
    public ResponseEntity<List<CriterioAceiteResponseDTO>> listarPorRequisito(
            @PathVariable UUID requisitoId) {
        return ResponseEntity.ok(criterioAceiteService.listarPorRequisito(requisitoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CriterioAceiteResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(criterioAceiteService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CriterioAceiteResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarCriterioAceiteRequestDTO request) {
        return ResponseEntity.ok(criterioAceiteService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        criterioAceiteService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
