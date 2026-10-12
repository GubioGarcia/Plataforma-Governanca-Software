package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.RelacionamentoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.RelacionamentoEntidadeService;
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
@RequestMapping("/api/relacionamento-entidade")
@RequiredArgsConstructor
public class RelacionamentoEntidadeController {

    private final RelacionamentoEntidadeService relacionamentoEntidadeService;

    @PostMapping
    public ResponseEntity<RelacionamentoEntidadeResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarRelacionamentoEntidadeRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(relacionamentoEntidadeService.criar(jwt, request));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<RelacionamentoEntidadeResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(relacionamentoEntidadeService.listarPorProjeto(projetoId));
    }

    @GetMapping("/entidade/{entidadeId}")
    public ResponseEntity<List<RelacionamentoEntidadeResponseDTO>> listarPorEntidade(@PathVariable UUID entidadeId) {
        return ResponseEntity.ok(relacionamentoEntidadeService.listarPorEntidade(entidadeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RelacionamentoEntidadeResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(relacionamentoEntidadeService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RelacionamentoEntidadeResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarRelacionamentoEntidadeRequestDTO request) {
        return ResponseEntity.ok(relacionamentoEntidadeService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        relacionamentoEntidadeService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
