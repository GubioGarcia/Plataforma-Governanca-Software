package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;

import java.time.Instant;
import java.util.UUID;

public record AuditoriaResponseDTO(
        UUID          id,
        UUID          organizacaoId,
        UUID          projetoId,
        String        entidadeTipo,
        UUID          entidadeId,
        AcaoAuditoria acao,
        String        campoAlterado,
        String        valorAnterior,
        String        valorNovo,
        UUID          usuarioId,
        String        usuarioNome,
        String        usuarioAvatarUrl,
        Instant       dataAlteracao
) {}
