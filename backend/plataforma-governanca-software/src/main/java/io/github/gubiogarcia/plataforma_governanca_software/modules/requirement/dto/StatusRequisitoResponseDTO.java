package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import java.util.UUID;

public record StatusRequisitoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        Integer ordem
) {}