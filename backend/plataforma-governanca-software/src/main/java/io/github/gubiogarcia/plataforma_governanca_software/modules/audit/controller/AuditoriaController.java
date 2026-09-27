package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AuditoriaResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de Auditoria.
 *
 * GET  /api/auditoria?entidadeTipo=REQUISITO&entidadeId={uuid}      — histórico de um registro (AUDIT_HISTORICO_VIEW)
 * GET  /api/auditoria/projeto/{projetoId}                           — log de um projeto (AUDIT_VIEW)
 * GET  /api/auditoria/projeto/{projetoId}?entidadeTipo=REQUISITO    — log por projeto + tipo (AUDIT_VIEW)
 * GET  /api/auditoria/{id}                                          — busca por id (AUDIT_HISTORICO_VIEW)
 *
 * Somente leitura: o log é gravado internamente pelos services via
 * AuditoriaService.registrar e não pode ser criado, alterado nem removido pela API.
 */
@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    /**
     * Histórico de um registro específico. entidadeTipo e entidadeId são obrigatórios:
     * listar tudo ou por tipo atravessaria organizações (multi-tenancy).
     */
    @GetMapping
    public ResponseEntity<List<AuditoriaResponseDTO>> listar(
            @RequestParam String entidadeTipo,
            @RequestParam UUID   entidadeId
    ) {
        return ResponseEntity.ok(auditoriaService.listarPorEntidade(entidadeTipo, entidadeId));
    }

    /** Lista auditorias de um projeto, com filtro opcional por entidadeTipo. */
    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<AuditoriaResponseDTO>> listarPorProjeto(
            @PathVariable UUID projetoId,
            @RequestParam(required = false) String entidadeTipo
    ) {
        return ResponseEntity.ok(auditoriaService.listarPorProjeto(projetoId, entidadeTipo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditoriaResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(auditoriaService.buscarPorId(id));
    }
}
