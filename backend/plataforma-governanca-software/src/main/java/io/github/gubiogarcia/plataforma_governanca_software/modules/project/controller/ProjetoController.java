package io.github.gubiogarcia.plataforma_governanca_software.modules.project.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.ProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.ProjetoService;
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
@RequestMapping("/api/projeto")
@RequiredArgsConstructor
public class ProjetoController {

    private final ProjetoService projetoService;

    @PostMapping
    public ResponseEntity<ProjetoResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarProjetoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projetoService.criar(jwt, request));
    }

    @GetMapping("/organizacao/{organizacaoId}")
    public ResponseEntity<List<ProjetoResponseDTO>> listarPorOrganizacao(
            @PathVariable UUID organizacaoId,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(projetoService.listarPorOrganizacao(organizacaoId, ativo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(projetoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarProjetoRequestDTO request) {
        return ResponseEntity.ok(projetoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        projetoService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}
