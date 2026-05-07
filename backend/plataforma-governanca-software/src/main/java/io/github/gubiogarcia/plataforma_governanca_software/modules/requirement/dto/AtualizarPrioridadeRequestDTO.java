package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import jakarta.validation.constraints.Size;

public record AtualizarPrioridadeRequestDTO(
        @Size(max = 50, message = "Nome deve ter no máximo 50 caracteres")
        String nome,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String descricao,

        Boolean ativo
) {}
