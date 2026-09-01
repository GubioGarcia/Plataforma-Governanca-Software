package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarEntidadeDadosRequestDTO(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String descricao
) {}
