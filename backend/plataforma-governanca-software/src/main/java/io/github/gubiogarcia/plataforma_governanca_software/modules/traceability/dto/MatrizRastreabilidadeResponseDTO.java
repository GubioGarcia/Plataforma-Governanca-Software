package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import java.util.List;
import java.util.UUID;

/**
 * Matriz de rastreabilidade de um projeto: os requisitos formam os eixos e
 * {@code celulas} traz apenas os pares com relação (direta e/ou indireta).
 * É computada a cada requisição — nunca materializada — portanto sempre
 * reflete o estado atual dos requisitos.
 */
public record MatrizRastreabilidadeResponseDTO(
        UUID projetoId,
        List<RequisitoResumoDTO> requisitos,
        List<CelulaMatrizDTO> celulas
) {}
