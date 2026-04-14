package io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjetoResponseDTO(
        UUID id,
        UUID organizacaoId,
        String organizacaoNome,
        String nome,
        String descricao,
        StatusProjetoResponseDTO status,
        Boolean ativo,
        UUID criadoPorId,
        String criadoPorNome,
        Instant dataCriacao,
        Instant dataAtualizacao
) {}
