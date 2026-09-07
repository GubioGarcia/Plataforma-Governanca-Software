package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import jakarta.validation.constraints.Size;

public record AtualizarAtributoEntidadeRequestDTO(
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Size(max = 50, message = "Tipo deve ter no máximo 50 caracteres")
        String tipo,

        Boolean obrigatorio,

        Boolean chavePrimaria,

        Integer ordem
) {}
