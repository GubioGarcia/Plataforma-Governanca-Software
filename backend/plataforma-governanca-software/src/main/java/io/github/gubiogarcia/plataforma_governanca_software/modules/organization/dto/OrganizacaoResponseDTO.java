package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto;

import java.time.Instant;
import java.util.UUID;

public record OrganizacaoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        String plano,
        Boolean ativo,
        UUID criadoPor,
        Instant dataCriacao,
        Instant dataAtualizacao,
        Long totalProjetosAtivos
) {}
