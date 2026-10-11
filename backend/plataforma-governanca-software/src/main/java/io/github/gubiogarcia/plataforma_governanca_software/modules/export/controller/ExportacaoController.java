package io.github.gubiogarcia.plataforma_governanca_software.modules.export.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.export.service.ExportacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * GET /api/projeto/{projetoId}/exportar/mer             — MER_EXPORT, ou solicitação EXPORT_MER atendida
 * GET /api/projeto/{projetoId}/exportar/rastreabilidade — RASTREABILIDADE_EXPORT, ou solicitação atendida
 */
@RestController
@RequestMapping("/api/projeto/{projetoId}/exportar")
@RequiredArgsConstructor
public class ExportacaoController {

    private static final MediaType CSV = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final ExportacaoService exportacaoService;

    @GetMapping("/mer")
    public ResponseEntity<byte[]> mer(@PathVariable UUID projetoId) {
        return arquivo(exportacaoService.exportarMer(projetoId));
    }

    @GetMapping("/rastreabilidade")
    public ResponseEntity<byte[]> rastreabilidade(@PathVariable UUID projetoId) {
        return arquivo(exportacaoService.exportarRastreabilidade(projetoId));
    }

    private ResponseEntity<byte[]> arquivo(ExportacaoService.ArquivoExportado arquivo) {
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo.nomeArquivo(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.conteudo());
    }
}
