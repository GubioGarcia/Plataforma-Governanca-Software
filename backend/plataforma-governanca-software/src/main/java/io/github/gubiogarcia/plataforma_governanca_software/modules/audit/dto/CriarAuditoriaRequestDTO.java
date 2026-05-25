package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CriarAuditoriaRequestDTO(
        UUID          organizacaoId,
        UUID          projetoId,

        @NotBlank
        String        entidadeTipo,

        @NotNull
        UUID          entidadeId,

        @NotNull
        AcaoAuditoria acao,

        @NotBlank
        String        campoAlterado,

        String        valorAnterior,
        String        valorNovo
) {}
