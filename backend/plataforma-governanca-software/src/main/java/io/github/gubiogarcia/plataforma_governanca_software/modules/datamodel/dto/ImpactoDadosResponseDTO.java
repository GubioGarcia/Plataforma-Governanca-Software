package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoOperacaoImpacto;

import java.time.Instant;
import java.util.UUID;

public record ImpactoDadosResponseDTO(
        UUID id,
        UUID requisitoId,
        String requisitoCodigo,
        String requisitoTitulo,
        UUID entidadeId,
        String entidadeNome,
        UUID atributoId,
        String atributoNome,
        TipoOperacaoImpacto tipoOperacao,
        String valorAnterior,
        String valorNovo,
        UUID criadoPorId,
        String criadoPorNome,
        Instant dataCriacao
) {}
