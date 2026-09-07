package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CriarRelacionamentoEntidadeRequestDTO(
        @NotNull(message = "Entidade de origem é obrigatória")
        UUID entidadeOrigemId,

        @NotNull(message = "Entidade de destino é obrigatória")
        UUID entidadeDestinoId,

        @NotNull(message = "Tipo é obrigatório")
        TipoRelacionamentoEntidade tipo,

        @Size(max = 100, message = "Atributo FK deve ter no máximo 100 caracteres")
        String atributoFk
) {

    /** Compatibilidade: chamadas anteriores sem o campo {@code atributoFk}. */
    public CriarRelacionamentoEntidadeRequestDTO(UUID entidadeOrigemId, UUID entidadeDestinoId,
                                                 TipoRelacionamentoEntidade tipo) {
        this(entidadeOrigemId, entidadeDestinoId, tipo, null);
    }
}
