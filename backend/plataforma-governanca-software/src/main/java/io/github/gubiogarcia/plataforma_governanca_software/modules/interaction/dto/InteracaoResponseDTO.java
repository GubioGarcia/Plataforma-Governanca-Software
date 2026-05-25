package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;

import java.time.Instant;
import java.util.UUID;

public record InteracaoResponseDTO(
        UUID id,
        UUID usuarioId,
        String usuarioNome,
        String usuarioUrlFoto,
        UUID projetoId,
        ModuloInteracao modulo,
        TipoInteracao tipo,
        UUID entidadeId,
        String descricao,
        Instant dataInteracao
) {}
