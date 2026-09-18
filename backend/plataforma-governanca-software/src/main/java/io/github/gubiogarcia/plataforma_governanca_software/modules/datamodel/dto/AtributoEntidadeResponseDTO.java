package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;

import java.util.UUID;

public record AtributoEntidadeResponseDTO(
        UUID id,
        UUID entidadeId,
        String nome,
        String tipo,
        Boolean obrigatorio,
        Boolean chavePrimaria,
        Integer ordem,
        Boolean chaveEstrangeira,
        UUID entidadeReferenciadaId,
        String entidadeReferenciadaNome,
        UUID relacionamentoId,
        TipoRelacionamentoEntidade tipoRelacionamento
) {}
