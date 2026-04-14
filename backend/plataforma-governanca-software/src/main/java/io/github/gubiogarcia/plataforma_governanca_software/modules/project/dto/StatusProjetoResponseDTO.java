package io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto;

import java.util.UUID;

public record StatusProjetoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        Integer ordem
) {}
