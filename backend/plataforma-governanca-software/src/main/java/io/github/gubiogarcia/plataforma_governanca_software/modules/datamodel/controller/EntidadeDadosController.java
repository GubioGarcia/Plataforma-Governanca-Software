package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.DiagramaProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.EntidadeDadosDetalheResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.EntidadeDadosResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.EntidadeDadosService;
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
@RequestMapping("/api/entidade-dados")
@RequiredArgsConstructor
public class EntidadeDadosController {

    private final EntidadeDadosService entidadeDadosService;

    @PostMapping("/projeto/{projetoId}")
    public ResponseEntity<EntidadeDadosResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projetoId,
            @Valid @RequestBody CriarEntidadeDadosRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entidadeDadosService.criar(jwt, projetoId, request));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<EntidadeDadosResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(entidadeDadosService.listarPorProjeto(projetoId));
    }

    @GetMapping("/projeto/{projetoId}/diagrama")
    public ResponseEntity<DiagramaProjetoResponseDTO> diagrama(
            @PathVariable UUID projetoId,
            @RequestParam(required = false) UUID entidadeDestacadaId) {
        return ResponseEntity.ok(entidadeDadosService.montarDiagrama(projetoId, entidadeDestacadaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntidadeDadosDetalheResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(entidadeDadosService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntidadeDadosResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarEntidadeDadosRequestDTO request) {
        return ResponseEntity.ok(entidadeDadosService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        entidadeDadosService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
