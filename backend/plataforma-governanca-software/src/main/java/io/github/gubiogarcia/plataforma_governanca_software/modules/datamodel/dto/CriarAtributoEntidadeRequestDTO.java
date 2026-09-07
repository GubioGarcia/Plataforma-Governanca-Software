package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarAtributoEntidadeRequestDTO(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @NotBlank(message = "Tipo é obrigatório")
        @Size(max = 50, message = "Tipo deve ter no máximo 50 caracteres")
        String tipo,

        @NotNull(message = "Obrigatório é obrigatório")
        Boolean obrigatorio,

        Integer ordem
) {}
