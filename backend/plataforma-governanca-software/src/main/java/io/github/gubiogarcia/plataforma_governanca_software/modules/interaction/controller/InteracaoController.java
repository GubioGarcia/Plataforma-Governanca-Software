package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto.InteracaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto.ResumoInteracaoProjetoDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interacao")
@RequiredArgsConstructor
public class InteracaoController {

    private final InteracaoService interacaoService;

    /**
     * Lista todas as interações de um projeto (linha do tempo).
     * GET /api/interacao/projeto/{projetoId}
     */
    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<InteracaoResponseDTO>> listarPorProjeto(
            @PathVariable UUID projetoId) {
        return ResponseEntity.ok(interacaoService.listarPorProjeto(projetoId));
    }

    /**
     * Lista interações de um usuário específico em um projeto.
     * GET /api/interacao/projeto/{projetoId}/usuario/{usuarioId}
     */
    @GetMapping("/projeto/{projetoId}/usuario/{usuarioId}")
    public ResponseEntity<List<InteracaoResponseDTO>> listarPorUsuario(
            @PathVariable UUID projetoId,
            @PathVariable UUID usuarioId) {
        return ResponseEntity.ok(interacaoService.listarPorUsuarioNoProjeto(projetoId, usuarioId));
    }

    /**
     * Resumo consolidado de interações para o projeto — usado por Stakeholders e Analytics.
     * GET /api/interacao/projeto/{projetoId}/resumo
     */
    @GetMapping("/projeto/{projetoId}/resumo")
    public ResponseEntity<ResumoInteracaoProjetoDTO> resumoPorProjeto(
            @PathVariable UUID projetoId) {
        return ResponseEntity.ok(interacaoService.resumoPorProjeto(projetoId));
    }
}
