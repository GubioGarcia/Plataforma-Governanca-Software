package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;

import java.util.UUID;

public record VinculoRequisitoResponseDTO(
        UUID id,
        UUID requisitoOrigemId,
        String requisitoOrigemCodigo,
        String requisitoOrigemTitulo,
        UUID requisitoDestinoId,
        String requisitoDestinoCodigo,
        String requisitoDestinoTitulo,
        TipoVinculoRequisito tipo,
        /** "SAIDA" quando o requisito consultado é a origem; "ENTRADA" quando é o destino. */
        String sentido
) {}
