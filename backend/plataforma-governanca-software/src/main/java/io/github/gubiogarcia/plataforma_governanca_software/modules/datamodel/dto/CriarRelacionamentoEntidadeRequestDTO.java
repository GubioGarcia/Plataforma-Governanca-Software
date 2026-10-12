package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Criação manual de um relacionamento sem atributo físico correspondente (caso avançado). */
public record CriarRelacionamentoEntidadeRequestDTO(
        @NotNull(message = "Entidade de origem é obrigatória")
        UUID entidadeOrigemId,

        @NotNull(message = "Entidade de destino é obrigatória")
        UUID entidadeDestinoId,

        @NotNull(message = "Tipo é obrigatório")
        TipoRelacionamentoEntidade tipo,

        /** Atributo (da entidade de origem) que materializa a FK. Opcional. */
        UUID atributoFkId
) {}
