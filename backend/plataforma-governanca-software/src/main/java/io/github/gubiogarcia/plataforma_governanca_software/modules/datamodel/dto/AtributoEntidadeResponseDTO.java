package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import java.util.UUID;

public record AtributoEntidadeResponseDTO(
        UUID id,
        UUID entidadeId,
        String nome,
        String tipo,
        Boolean obrigatorio,
        Boolean chavePrimaria,
        Integer ordem
) {}
