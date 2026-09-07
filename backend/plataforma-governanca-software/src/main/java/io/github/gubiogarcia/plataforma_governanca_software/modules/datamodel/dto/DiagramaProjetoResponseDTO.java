package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import java.util.List;
import java.util.UUID;

/**
 * Fonte de dados para renderizar o diagrama ER do projeto (ex: Mermaid
 * {@code erDiagram}) no frontend. {@code entidadeDestacadaId} indica qual
 * entidade o requisito aberto está afetando, para destaque visual.
 */
public record DiagramaProjetoResponseDTO(
        UUID projetoId,
        UUID entidadeDestacadaId,
        List<EntidadeDadosDetalheResponseDTO> entidades,
        List<RelacionamentoEntidadeResponseDTO> relacionamentos
) {}
