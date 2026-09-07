package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarRelacionamentoEntidadeRequestDTO(
        @NotNull(message = "Tipo é obrigatório")
        TipoRelacionamentoEntidade tipo,

        @Size(max = 100, message = "Atributo FK deve ter no máximo 100 caracteres")
        String atributoFk
) {}
