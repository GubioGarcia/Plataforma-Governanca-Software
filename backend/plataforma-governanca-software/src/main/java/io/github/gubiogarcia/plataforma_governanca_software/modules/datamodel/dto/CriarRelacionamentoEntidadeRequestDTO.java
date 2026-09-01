package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CriarRelacionamentoEntidadeRequestDTO(
        @NotNull(message = "Entidade de origem é obrigatória")
        UUID entidadeOrigemId,

        @NotNull(message = "Entidade de destino é obrigatória")
        UUID entidadeDestinoId,

        @NotNull(message = "Tipo é obrigatório")
        TipoRelacionamentoEntidade tipo
) {}
