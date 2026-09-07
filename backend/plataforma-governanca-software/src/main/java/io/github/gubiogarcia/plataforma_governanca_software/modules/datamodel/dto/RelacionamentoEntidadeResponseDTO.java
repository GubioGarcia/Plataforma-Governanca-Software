package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;

import java.util.UUID;

public record RelacionamentoEntidadeResponseDTO(
        UUID id,
        UUID entidadeOrigemId,
        String entidadeOrigemNome,
        UUID entidadeDestinoId,
        String entidadeDestinoNome,
        TipoRelacionamentoEntidade tipo,
        String atributoFk
) {}
