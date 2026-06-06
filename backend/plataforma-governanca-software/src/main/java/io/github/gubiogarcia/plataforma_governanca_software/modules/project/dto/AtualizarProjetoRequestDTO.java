package io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AtualizarProjetoRequestDTO(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
        String descricao,

        @NotNull(message = "O ID do status é obrigatório")
        UUID statusId
) {}
