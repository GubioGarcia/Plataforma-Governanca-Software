package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import java.util.UUID;

/** Linha/coluna da matriz de rastreabilidade — identificação enxuta de um requisito. */
public record RequisitoResumoDTO(
        UUID id,
        String codigo,
        String titulo,
        UUID statusId,
        String statusNome
) {}
