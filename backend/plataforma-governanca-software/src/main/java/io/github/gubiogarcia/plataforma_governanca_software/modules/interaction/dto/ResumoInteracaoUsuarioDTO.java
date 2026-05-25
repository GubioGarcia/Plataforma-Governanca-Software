package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto;

import java.util.UUID;

/**
 * Resumo de interações de um usuário em um projeto.
 * Retornado pelo endpoint de analytics/stakeholders.
 */
public record ResumoInteracaoUsuarioDTO(
        UUID usuarioId,
        String usuarioNome,
        String usuarioEmail,
        String usuarioUrlFoto,
        long totalInteracoes,
        long interacoesWiki,
        long interacoesRequisito,
        long interacoesComentario,
        long interacoesEvento
) {}
