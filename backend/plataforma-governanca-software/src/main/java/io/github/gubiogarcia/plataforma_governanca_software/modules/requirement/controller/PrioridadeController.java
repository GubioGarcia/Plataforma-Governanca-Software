package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarPrioridadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarPrioridadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.PrioridadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.PrioridadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prioridade")
@RequiredArgsConstructor
public class PrioridadeController {

    private final PrioridadeService prioridadeService;

    @PostMapping
    public ResponseEntity<PrioridadeResponseDTO> criar(
            @Valid @RequestBody CriarPrioridadeRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prioridadeService.criar(request));
    }

    @GetMapping
    public ResponseEntity<List<PrioridadeResponseDTO>> listar() {
        return ResponseEntity.ok(prioridadeService.listar());
    }

    @GetMapping("/ativas")
    public ResponseEntity<List<PrioridadeResponseDTO>> listarAtivas() {
        return ResponseEntity.ok(prioridadeService.listarAtivas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrioridadeResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(prioridadeService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrioridadeResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarPrioridadeRequestDTO request) {
        return ResponseEntity.ok(prioridadeService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        prioridadeService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
