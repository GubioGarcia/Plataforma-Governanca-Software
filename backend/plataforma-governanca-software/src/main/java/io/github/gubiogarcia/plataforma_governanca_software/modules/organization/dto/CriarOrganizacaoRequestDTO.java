package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarOrganizacaoRequestDTO(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
        String descricao,

        @Size(max = 50, message = "Plano deve ter no máximo 50 caracteres")
        String plano
) {}
