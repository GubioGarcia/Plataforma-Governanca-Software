package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.CriarSolicitacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.ResponderSolicitacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.SolicitacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.service.SolicitacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * POST /api/projeto/{projetoId}/solicitacoes          — permissão *_REQUEST do tipo
 * GET  /api/projeto/{projetoId}/solicitacoes?status=  — responsáveis veem todas; demais, as próprias
 * POST /api/solicitacoes/{id}/atender | /recusar      — SOLICITACAO_RESPONDER
 * POST /api/solicitacoes/{id}/cancelar                — o próprio solicitante
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SolicitacaoController {

    private final SolicitacaoService solicitacaoService;

    @PostMapping("/projeto/{projetoId}/solicitacoes")
    public ResponseEntity<SolicitacaoResponseDTO> criar(
            @PathVariable UUID projetoId, @Valid @RequestBody CriarSolicitacaoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitacaoService.criar(projetoId, request));
    }

    @GetMapping("/projeto/{projetoId}/solicitacoes")
    public ResponseEntity<List<SolicitacaoResponseDTO>> listar(
            @PathVariable UUID projetoId, @RequestParam(required = false) StatusSolicitacao status) {
        return ResponseEntity.ok(solicitacaoService.listar(projetoId, status));
    }

    @PostMapping("/solicitacoes/{id}/atender")
    public ResponseEntity<SolicitacaoResponseDTO> atender(
            @PathVariable UUID id, @Valid @RequestBody(required = false) ResponderSolicitacaoRequestDTO request) {
        return ResponseEntity.ok(solicitacaoService.atender(id, request != null ? request.resposta() : null));
    }

    @PostMapping("/solicitacoes/{id}/recusar")
    public ResponseEntity<SolicitacaoResponseDTO> recusar(
            @PathVariable UUID id, @Valid @RequestBody(required = false) ResponderSolicitacaoRequestDTO request) {
        return ResponseEntity.ok(solicitacaoService.recusar(id, request != null ? request.resposta() : null));
    }

    @PostMapping("/solicitacoes/{id}/cancelar")
    public ResponseEntity<SolicitacaoResponseDTO> cancelar(@PathVariable UUID id) {
        return ResponseEntity.ok(solicitacaoService.cancelar(id));
    }
}
