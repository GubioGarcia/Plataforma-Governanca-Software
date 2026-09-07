package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoOperacaoImpacto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CriarImpactoDadosRequestDTO(
        @NotNull(message = "Entidade é obrigatória")
        UUID entidadeId,

        UUID atributoId,

        @NotNull(message = "Tipo de operação é obrigatório")
        TipoOperacaoImpacto tipoOperacao,

        @Size(max = 4000, message = "Valor anterior deve ter no máximo 4000 caracteres")
        String valorAnterior,

        @Size(max = 4000, message = "Valor novo deve ter no máximo 4000 caracteres")
        String valorNovo
) {}
