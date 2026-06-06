package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AtualizarRequisitoRequestDTO(
        @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
        String titulo,

        @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
        String descricao,

        TipoRequisito tipoRequisito,
        UUID statusId,
        UUID prioridadeId
) {}
