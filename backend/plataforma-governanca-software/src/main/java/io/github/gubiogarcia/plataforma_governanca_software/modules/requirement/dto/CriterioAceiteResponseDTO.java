package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import java.time.Instant;
import java.util.UUID;

public record CriterioAceiteResponseDTO(
        UUID id,
        String nome,
        String descricao,
        UUID requisitoId,
        String criadoPorNome,
        UUID criadoPorId,
        Instant dataCriacao,
        Instant dataAtualizacao
) {}
