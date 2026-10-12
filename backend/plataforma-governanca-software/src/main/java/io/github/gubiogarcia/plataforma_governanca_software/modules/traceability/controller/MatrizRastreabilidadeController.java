package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.AnaliseImpactoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.MatrizRastreabilidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service.MatrizRastreabilidadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/rastreabilidade")
@RequiredArgsConstructor
public class MatrizRastreabilidadeController {

    private final MatrizRastreabilidadeService matrizRastreabilidadeService;

    /** Matriz requisito × requisito do projeto (relações diretas + indiretas). */
    @GetMapping("/projeto/{projetoId}/matriz")
    public ResponseEntity<MatrizRastreabilidadeResponseDTO> matriz(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(matrizRastreabilidadeService.montarMatriz(projetoId));
    }

    /** Análise de impacto de mudança: requisitos afetados a partir de um requisito. */
    @GetMapping("/requisito/{requisitoId}/impacto")
    public ResponseEntity<AnaliseImpactoResponseDTO> impacto(@PathVariable UUID requisitoId) {
        return ResponseEntity.ok(matrizRastreabilidadeService.analisarImpacto(requisitoId));
    }
}
