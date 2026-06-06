package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarCriterioAceiteRequestDTO(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
        String descricao
) {}
