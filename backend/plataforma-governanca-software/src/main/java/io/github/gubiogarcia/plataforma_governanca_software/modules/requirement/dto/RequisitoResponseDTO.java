package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import java.time.Instant;
import java.util.UUID;

public record RequisitoResponseDTO(
        UUID id,
        String codigo,
        String titulo,
        String descricao,
        String tipoRequisito,
        UUID statusId,
        String statusNome,
        UUID prioridadeId,
        String prioridadeNome,
        Integer versao,
        UUID criadoPorId,
        String criadoPorNome,
        UUID solicitadoPorId,
        String solicitadoPorNome,
        UUID aprovadoPorId,
        String aprovadoPorNome,
        Instant dataCriacao,
        Instant dataAtualizacao,
        Instant dataSolicitacao,
        Instant dataAprovacao
) {}
