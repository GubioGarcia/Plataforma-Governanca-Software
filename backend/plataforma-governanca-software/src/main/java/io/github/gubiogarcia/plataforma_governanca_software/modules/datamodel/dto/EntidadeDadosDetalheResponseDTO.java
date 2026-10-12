package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Visão completa de uma EntidadeDados: dados básicos + atributos + os
 * relacionamentos em que ela participa (como origem ou destino).
 */
public record EntidadeDadosDetalheResponseDTO(
        UUID id,
        UUID projetoId,
        String nome,
        String descricao,
        Boolean ativo,
        UUID criadoPorId,
        String criadoPorNome,
        Instant dataCriacao,
        Instant dataAtualizacao,
        List<AtributoEntidadeResponseDTO> atributos,
        List<RelacionamentoEntidadeResponseDTO> relacionamentos
) {}
