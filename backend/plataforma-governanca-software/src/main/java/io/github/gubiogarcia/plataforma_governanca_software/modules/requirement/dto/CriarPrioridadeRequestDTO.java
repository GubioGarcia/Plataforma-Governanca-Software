package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarPrioridadeRequestDTO(
        @NotBlank(message = "O código é obrigatório")
        @Size(max = 20, message = "Código deve ter no máximo 20 caracteres")
        String codigo,

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 50, message = "Nome deve ter no máximo 50 caracteres")
        String nome,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String descricao,

        @NotNull(message = "A ordem é obrigatória")
        Integer ordem
) {}
