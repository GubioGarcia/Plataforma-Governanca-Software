package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CriarRequisitoRequestDTO(
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
        String titulo,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
        String descricao,

        @NotNull(message = "Tipo de requisito é obrigatório") TipoRequisito tipoRequisito,
        UUID statusId,
        UUID prioridadeId
) {}
