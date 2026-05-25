package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AtualizarAuditoriaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AuditoriaResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.CriarAuditoriaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de Auditoria.
 *
 * GET  /api/auditoria                                               — lista todas as auditorias
 * GET  /api/auditoria?entidadeTipo=REQUISITO                        — filtra por tipo
 * GET  /api/auditoria?entidadeTipo=REQUISITO&entidadeId={uuid}      — filtra por entidade específica
 * GET  /api/auditoria/projeto/{projetoId}                           — log de um projeto
 * GET  /api/auditoria/projeto/{projetoId}?entidadeTipo=REQUISITO    — log por projeto + tipo
 * GET  /api/auditoria/{id}                                          — busca por id
 * POST /api/auditoria                                               — cria registro manual
 * PUT  /api/auditoria/{id}                                          — corrige registro
 * DEL  /api/auditoria/{id}                                          — remove registro
 */
@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    /** Lista todas as auditorias ou filtra por entidadeTipo e/ou entidadeId. */
    @GetMapping
    public ResponseEntity<List<AuditoriaResponseDTO>> listar(
            @RequestParam(required = false) String entidadeTipo,
            @RequestParam(required = false) UUID   entidadeId
    ) {
        if (entidadeTipo != null && entidadeId != null) {
            return ResponseEntity.ok(auditoriaService.listarPorEntidade(entidadeTipo, entidadeId));
        }
        if (entidadeTipo != null) {
            return ResponseEntity.ok(auditoriaService.listarPorTipo(entidadeTipo));
        }
        return ResponseEntity.ok(auditoriaService.listarTodos());
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

    @PostMapping
    public ResponseEntity<AuditoriaResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarAuditoriaRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditoriaService.criar(jwt, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuditoriaResponseDTO> atualizar(
            @PathVariable UUID id,
            @RequestBody AtualizarAuditoriaRequestDTO request
    ) {
        return ResponseEntity.ok(auditoriaService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        auditoriaService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
