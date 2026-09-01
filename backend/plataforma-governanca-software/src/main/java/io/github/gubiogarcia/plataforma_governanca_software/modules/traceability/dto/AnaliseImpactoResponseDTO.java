package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import java.util.List;
import java.util.UUID;

/**
 * Resultado da análise de impacto de mudança: todos os requisitos alcançáveis
 * a partir de {@code requisitoRaizId} pelo grafo de vínculos diretos +
 * indiretos (travessia em largura), ordenados por distância.
 */
public record AnaliseImpactoResponseDTO(
        UUID requisitoRaizId,
        String requisitoRaizCodigo,
        String requisitoRaizTitulo,
        List<RequisitoImpactadoDTO> impactados
) {}
