package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.StatusRequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.StatusRequisitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/status-requisito")
@RequiredArgsConstructor
public class StatusRequisitoController {

    private final StatusRequisitoService statusRequisitoService;

    @PostMapping
    public ResponseEntity<StatusRequisitoResponseDTO> criar(
            @Valid @RequestBody CriarStatusRequisitoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(statusRequisitoService.criar(request));
    }

    @GetMapping
    public ResponseEntity<List<StatusRequisitoResponseDTO>> listar() {
        return ResponseEntity.ok(statusRequisitoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusRequisitoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(statusRequisitoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusRequisitoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarStatusRequisitoRequestDTO request) {
        return ResponseEntity.ok(statusRequisitoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        statusRequisitoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}