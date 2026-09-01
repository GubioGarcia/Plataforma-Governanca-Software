package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.NotNull;

public record AtualizarRelacionamentoEntidadeRequestDTO(
        @NotNull(message = "Tipo é obrigatório")
        TipoRelacionamentoEntidade tipo
) {}
