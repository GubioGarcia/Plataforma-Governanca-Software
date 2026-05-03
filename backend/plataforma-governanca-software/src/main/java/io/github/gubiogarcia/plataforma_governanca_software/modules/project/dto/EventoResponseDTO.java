package io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto;

import java.time.Instant;
import java.util.UUID;

public record EventoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        UUID projetoId,
        String projetoNome,
        UUID organizacaoId,
        String organizacaoNome,
        UUID criadoPorId,
        String criadoPorNome,
        Instant dataHoraInicio,
        Instant dataHoraFim,
        Instant dataCriacao
) {}