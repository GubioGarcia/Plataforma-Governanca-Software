package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto;

import java.util.UUID;

public record PrioridadeResponseDTO(
        UUID id,
        String codigo,
        String nome,
        String descricao,
        Integer ordem,
        Boolean ativo
) {}
