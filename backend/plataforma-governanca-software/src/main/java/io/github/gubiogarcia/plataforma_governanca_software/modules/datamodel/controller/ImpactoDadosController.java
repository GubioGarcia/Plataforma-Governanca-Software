package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.ImpactoDadosPorEntidadeDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.ImpactoDadosResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.ImpactoDadosService;
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
@RequestMapping("/api/impacto-dados")
@RequiredArgsConstructor
public class ImpactoDadosController {

    private final ImpactoDadosService impactoDadosService;

    @PostMapping("/requisito/{requisitoId}")
    public ResponseEntity<ImpactoDadosResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID requisitoId,
            @Valid @RequestBody CriarImpactoDadosRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(impactoDadosService.criar(jwt, requisitoId, request));
    }

    @GetMapping("/requisito/{requisitoId}")
    public ResponseEntity<List<ImpactoDadosResponseDTO>> listarPorRequisito(@PathVariable UUID requisitoId) {
        return ResponseEntity.ok(impactoDadosService.listarPorRequisito(requisitoId));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<ImpactoDadosResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(impactoDadosService.listarPorProjeto(projetoId));
    }

    @GetMapping("/requisito/{requisitoId}/agrupado")
    public ResponseEntity<List<ImpactoDadosPorEntidadeDTO>> listarPorRequisitoAgrupado(@PathVariable UUID requisitoId) {
        return ResponseEntity.ok(impactoDadosService.listarPorRequisitoAgrupado(requisitoId));
    }

    @GetMapping("/entidade/{entidadeId}")
    public ResponseEntity<List<ImpactoDadosResponseDTO>> listarPorEntidade(@PathVariable UUID entidadeId) {
        return ResponseEntity.ok(impactoDadosService.listarPorEntidade(entidadeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImpactoDadosResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(impactoDadosService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ImpactoDadosResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarImpactoDadosRequestDTO request) {
        return ResponseEntity.ok(impactoDadosService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        impactoDadosService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
