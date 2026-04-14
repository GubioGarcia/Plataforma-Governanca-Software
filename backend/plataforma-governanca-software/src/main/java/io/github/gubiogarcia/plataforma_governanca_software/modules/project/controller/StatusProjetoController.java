package io.github.gubiogarcia.plataforma_governanca_software.modules.project.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.StatusProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.StatusProjetoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/status-projeto")
@RequiredArgsConstructor
public class StatusProjetoController {

    private final StatusProjetoService statusProjetoService;

    @PostMapping
    public ResponseEntity<StatusProjetoResponseDTO> criar(
            @Valid @RequestBody CriarStatusProjetoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(statusProjetoService.criar(request));
    }

    @GetMapping
    public ResponseEntity<List<StatusProjetoResponseDTO>> listar() {
        return ResponseEntity.ok(statusProjetoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusProjetoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(statusProjetoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusProjetoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarStatusProjetoRequestDTO request) {
        return ResponseEntity.ok(statusProjetoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        statusProjetoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
