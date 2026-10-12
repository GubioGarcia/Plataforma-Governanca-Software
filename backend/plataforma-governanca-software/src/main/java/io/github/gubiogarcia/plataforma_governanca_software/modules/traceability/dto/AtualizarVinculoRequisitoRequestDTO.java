package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import jakarta.validation.constraints.NotNull;

public record AtualizarVinculoRequisitoRequestDTO(
        @NotNull(message = "Tipo do vínculo é obrigatório")
        TipoVinculoRequisito tipo
) {}
