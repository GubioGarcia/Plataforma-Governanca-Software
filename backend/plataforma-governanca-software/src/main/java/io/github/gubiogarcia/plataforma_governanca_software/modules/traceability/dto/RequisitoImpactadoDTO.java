package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoRelacaoMatriz;

import java.util.List;
import java.util.UUID;

/**
 * Um requisito alcançado pela análise de impacto, com a distância (nº de
 * saltos) a partir do requisito raiz e o caminho percorrido (códigos).
 */
public record RequisitoImpactadoDTO(
        UUID requisitoId,
        String codigo,
        String titulo,
        String statusNome,
        int distancia,
        TipoRelacaoMatriz tipoRelacao,
        List<String> caminho
) {}
