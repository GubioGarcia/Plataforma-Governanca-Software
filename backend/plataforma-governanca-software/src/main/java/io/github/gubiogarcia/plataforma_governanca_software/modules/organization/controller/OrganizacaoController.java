package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.AtualizarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.CriarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.OrganizacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service.OrganizacaoService;
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
@RequestMapping("/api/organizacao")
@RequiredArgsConstructor
public class OrganizacaoController {

    private final OrganizacaoService organizacaoService;

    @PostMapping
    public ResponseEntity<OrganizacaoResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarOrganizacaoRequestDTO request) {
        OrganizacaoResponseDTO organizacao = organizacaoService.criar(jwt, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(organizacao);
    }

    @GetMapping
    public ResponseEntity<List<OrganizacaoResponseDTO>> listar(
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(organizacaoService.listar(ativo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizacaoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(organizacaoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizacaoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarOrganizacaoRequestDTO request) {
        return ResponseEntity.ok(organizacaoService.atualizar(id, request));
    }

    @PatchMapping("/{id}/ativar")
    public ResponseEntity<OrganizacaoResponseDTO> ativar(@PathVariable UUID id) {
        return ResponseEntity.ok(organizacaoService.ativar(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        organizacaoService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}