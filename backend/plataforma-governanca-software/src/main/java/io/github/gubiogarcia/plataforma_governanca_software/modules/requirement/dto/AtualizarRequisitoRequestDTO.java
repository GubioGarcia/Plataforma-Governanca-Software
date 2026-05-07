package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;

import java.util.UUID;

public record AtualizarRequisitoRequestDTO(
        String titulo,
        String descricao,
        TipoRequisito tipoRequisito,
        UUID statusId,
        UUID prioridadeId
) {}
