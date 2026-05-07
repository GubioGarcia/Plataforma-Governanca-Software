package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CriarRequisitoRequestDTO(
        @NotBlank(message = "Título é obrigatório") String titulo,
        @NotBlank(message = "Descrição é obrigatória") String descricao,
        @NotNull(message = "Tipo de requisito é obrigatório") TipoRequisito tipoRequisito,
        UUID statusId,
        UUID prioridadeId
) {}
