package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import java.util.List;
import java.util.UUID;

/**
 * Alterações que um requisito faz agrupadas por entidade afetada — base da
 * visão "estado atual vs. proposto" apresentada na tela do requisito.
 */
public record ImpactoDadosPorEntidadeDTO(
        UUID entidadeId,
        String entidadeNome,
        List<ImpactoDadosResponseDTO> alteracoes
) {}
