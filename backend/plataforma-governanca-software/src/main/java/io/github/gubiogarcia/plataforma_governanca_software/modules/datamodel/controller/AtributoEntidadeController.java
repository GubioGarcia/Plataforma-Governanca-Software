package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.AtributoEntidadeService;
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
@RequestMapping("/api/atributo-entidade")
@RequiredArgsConstructor
public class AtributoEntidadeController {

    private final AtributoEntidadeService atributoEntidadeService;

    @PostMapping("/entidade/{entidadeId}")
    public ResponseEntity<AtributoEntidadeResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID entidadeId,
            @Valid @RequestBody CriarAtributoEntidadeRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atributoEntidadeService.criar(jwt, entidadeId, request));
    }

    @GetMapping("/entidade/{entidadeId}")
    public ResponseEntity<List<AtributoEntidadeResponseDTO>> listarPorEntidade(@PathVariable UUID entidadeId) {
        return ResponseEntity.ok(atributoEntidadeService.listarPorEntidade(entidadeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtributoEntidadeResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(atributoEntidadeService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtributoEntidadeResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarAtributoEntidadeRequestDTO request) {
        return ResponseEntity.ok(atributoEntidadeService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        atributoEntidadeService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
