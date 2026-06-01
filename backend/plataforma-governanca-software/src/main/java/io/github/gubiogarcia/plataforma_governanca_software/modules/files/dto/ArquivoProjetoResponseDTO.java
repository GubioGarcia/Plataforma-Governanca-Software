package io.github.gubiogarcia.plataforma_governanca_software.modules.files.dto;

import java.time.Instant;
import java.util.UUID;

public record ArquivoProjetoResponseDTO(
        UUID id,
        String nomeOriginal,
        String extensao,
        String mimeType,
        Long tamanhoBytes,
        Instant dataUpload,
        String usuarioUpload
) {}
