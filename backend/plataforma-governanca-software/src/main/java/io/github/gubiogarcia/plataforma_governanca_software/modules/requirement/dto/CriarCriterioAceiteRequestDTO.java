package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import jakarta.validation.constraints.NotBlank;

public record CriarCriterioAceiteRequestDTO(
        @NotBlank(message = "Nome é obrigatório") String nome,
        @NotBlank(message = "Descrição é obrigatória") String descricao
) {}
