package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ParticipanteDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service.MembrosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * GET    /api/organizacao/{orgId}/membros                        — ORG_VIEW_USERS
 * POST   /api/organizacao/{orgId}/membros/{usuarioId}/promover   — ORG_PROMOTE_USER (Membro → Gestor)
 * DELETE /api/organizacao/{orgId}/membros/{usuarioId}            — ORG_REMOVE_USER (só Dono)
 * GET    /api/projeto/{projetoId}/participantes                  — PROJETO_VIEW_USERS
 * POST   /api/projeto/{projetoId}/participantes/{usuarioId}/promover — PROJETO_PROMOTE_USER
 * DELETE /api/projeto/{projetoId}/participantes/{usuarioId}      — PROJETO_REMOVE_USER
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MembrosController {

    private final MembrosService membrosService;

    @GetMapping("/organizacao/{orgId}/membros")
    public ResponseEntity<List<ParticipanteDTO>> listarDaOrganizacao(@PathVariable UUID orgId) {
        return ResponseEntity.ok(membrosService.listarDaOrganizacao(orgId));
    }

    @PostMapping("/organizacao/{orgId}/membros/{usuarioId}/promover")
    public ResponseEntity<Void> promoverNaOrganizacao(@PathVariable UUID orgId, @PathVariable UUID usuarioId) {
        membrosService.promoverNaOrganizacao(orgId, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/organizacao/{orgId}/membros/{usuarioId}")
    public ResponseEntity<Void> removerDaOrganizacao(@PathVariable UUID orgId, @PathVariable UUID usuarioId) {
        membrosService.removerDaOrganizacao(orgId, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projeto/{projetoId}/participantes")
    public ResponseEntity<List<ParticipanteDTO>> listarDoProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(membrosService.listarDoProjeto(projetoId));
    }

    @PostMapping("/projeto/{projetoId}/participantes/{usuarioId}/promover")
    public ResponseEntity<Void> promoverNoProjeto(@PathVariable UUID projetoId, @PathVariable UUID usuarioId) {
        membrosService.promoverNoProjeto(projetoId, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/projeto/{projetoId}/participantes/{usuarioId}")
    public ResponseEntity<Void> removerDoProjeto(@PathVariable UUID projetoId, @PathVariable UUID usuarioId) {
        membrosService.removerDoProjeto(projetoId, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
