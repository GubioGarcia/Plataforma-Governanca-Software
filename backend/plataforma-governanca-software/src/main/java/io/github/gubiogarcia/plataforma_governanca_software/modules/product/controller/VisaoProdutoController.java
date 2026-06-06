package io.github.gubiogarcia.plataforma_governanca_software.modules.product.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.AtualizarVisaoProdutoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.VisaoProdutoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.service.VisaoProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class VisaoProdutoController {

    private final VisaoProdutoService visaoProdutoService;

    /**
     * GET /api/projeto/{projetoId}/wiki
     * Retorna a Wiki (VisaoProduto) de um projeto.
     */
    @GetMapping("/api/projeto/{projetoId}/wiki")
    public ResponseEntity<VisaoProdutoResponseDTO> buscarPorProjetoId(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(visaoProdutoService.buscarPorProjetoId(projetoId));
    }

    /**
     * GET /api/wiki/{id}
     * Busca direta pelo ID da VisaoProduto.
     */
    @GetMapping("/api/wiki/{id}")
    public ResponseEntity<VisaoProdutoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(visaoProdutoService.buscarPorId(id));
    }

    /**
     * PUT /api/projeto/{projetoId}/wiki
     * Atualiza os campos da Wiki. Nao ha DELETE conforme regra de negocio.
     */
    @PutMapping("/api/projeto/{projetoId}/wiki")
    public ResponseEntity<VisaoProdutoResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projetoId,
            @Valid @RequestBody AtualizarVisaoProdutoRequestDTO request) {
        return ResponseEntity.ok(visaoProdutoService.atualizar(jwt, projetoId, request));
    }
}