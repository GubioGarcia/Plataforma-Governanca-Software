package io.github.gubiogarcia.plataforma_governanca_software.modules.files.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.files.dto.ArquivoProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.files.service.ArquivoProjetoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ArquivoProjetoController {

    private final ArquivoProjetoService arquivoService;

    // POST /api/projects/{projectId}/files/upload
    @PostMapping("/api/projects/{projectId}/files/upload")
    public ResponseEntity<ArquivoProjetoResponseDTO> upload(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {
        ArquivoProjetoResponseDTO response = arquivoService.upload(jwt, projectId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET /api/projects/{projectId}/files
    @GetMapping("/api/projects/{projectId}/files")
    public ResponseEntity<List<ArquivoProjetoResponseDTO>> listar(@PathVariable UUID projectId) {
        return ResponseEntity.ok(arquivoService.listar(projectId));
    }

    // GET /api/files/{fileId}/download
    @GetMapping("/api/files/{fileId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable UUID fileId) {
        ArquivoProjetoService.DownloadResult result = arquivoService.download(fileId);

        String mimeType = result.mimeType() != null ? result.mimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(mimeType));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(result.nomeOriginal()).build()
        );

        return ResponseEntity.ok().headers(headers).body(result.resource());
    }

    // DELETE /api/files/{fileId}
    @DeleteMapping("/api/files/{fileId}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID fileId) {
        arquivoService.deletar(jwt, fileId);
        return ResponseEntity.noContent().build();
    }
}
