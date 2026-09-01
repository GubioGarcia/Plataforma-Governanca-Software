package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoRelacaoMatriz;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;

import java.util.List;
import java.util.UUID;

/**
 * Célula (requisito origem × requisito destino) da matriz de rastreabilidade.
 * Só são emitidas células com alguma relação — a matriz é esparsa.
 */
public record CelulaMatrizDTO(
        UUID requisitoOrigemId,
        UUID requisitoDestinoId,
        TipoRelacaoMatriz tipoRelacao,
        /** Preenchido quando há vínculo DIRETO (ou MISTO). */
        List<TipoVinculoRequisito> tiposVinculo,
        /** Nomes das entidades compartilhadas quando há relação INDIRETA (ou MISTA). */
        List<String> entidadesCompartilhadas
) {}
