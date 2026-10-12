package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CriarVinculoRequisitoRequestDTO(
        @NotNull(message = "Requisito de destino é obrigatório")
        UUID requisitoDestinoId,

        @NotNull(message = "Tipo do vínculo é obrigatório")
        TipoVinculoRequisito tipo
) {}
