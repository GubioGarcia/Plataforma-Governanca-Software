package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ConviteDTOs.ConviteResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ConviteDTOs.CriarConviteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service.ConviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * POST/GET /api/organizacao/{orgId}/convites  — ORG_INVITE_USER (papel GESTOR | MEMBRO)
 * POST/GET /api/projeto/{projetoId}/convites  — PROJETO_INVITE_USER (papel GESTOR | STAKEHOLDER)
 * GET      /api/convites/meus                 — convites pendentes para o e-mail do usuário
 * POST     /api/convites/{id}/aceitar|recusar — só o convidado
 * DELETE   /api/convites/{id}                 — cancelar (mesma permissão de convidar)
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConviteController {

    private final ConviteService conviteService;

    @PostMapping("/organizacao/{orgId}/convites")
    public ResponseEntity<ConviteResponseDTO> convidarParaOrganizacao(
            @PathVariable UUID orgId, @Valid @RequestBody CriarConviteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conviteService.convidarParaOrganizacao(orgId, request));
    }

    @GetMapping("/organizacao/{orgId}/convites")
    public ResponseEntity<List<ConviteResponseDTO>> listarDaOrganizacao(@PathVariable UUID orgId) {
        return ResponseEntity.ok(conviteService.listarDaOrganizacao(orgId));
    }

    @PostMapping("/projeto/{projetoId}/convites")
    public ResponseEntity<ConviteResponseDTO> convidarParaProjeto(
            @PathVariable UUID projetoId, @Valid @RequestBody CriarConviteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conviteService.convidarParaProjeto(projetoId, request));
    }

    @GetMapping("/projeto/{projetoId}/convites")
    public ResponseEntity<List<ConviteResponseDTO>> listarDoProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(conviteService.listarDoProjeto(projetoId));
    }

    @GetMapping("/convites/meus")
    public ResponseEntity<List<ConviteResponseDTO>> meus() {
        return ResponseEntity.ok(conviteService.listarMeus());
    }

    @PostMapping("/convites/{id}/aceitar")
    public ResponseEntity<ConviteResponseDTO> aceitar(@PathVariable UUID id) {
        return ResponseEntity.ok(conviteService.aceitar(id));
    }

    @PostMapping("/convites/{id}/recusar")
    public ResponseEntity<ConviteResponseDTO> recusar(@PathVariable UUID id) {
        return ResponseEntity.ok(conviteService.recusar(id));
    }

    @DeleteMapping("/convites/{id}")
    public ResponseEntity<Void> cancelar(@PathVariable UUID id) {
        conviteService.cancelar(id);
        return ResponseEntity.noContent().build();
    }
}
