package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto;

import java.util.List;
import java.util.Map;

/**
 * Resumo global de interações de um projeto.
 */
public record ResumoInteracaoProjetoDTO(
        long totalInteracoes,
        long totalMembros,
        Map<String, Long> interacoesPorModulo,
        List<ResumoInteracaoUsuarioDTO> porUsuario
) {}
