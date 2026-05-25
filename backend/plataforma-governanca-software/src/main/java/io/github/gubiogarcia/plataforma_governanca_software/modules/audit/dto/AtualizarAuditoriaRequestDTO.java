package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto;

/**
 * DTO para atualização pontual de um registro de auditoria.
 * Na prática, auditorias raramente são editadas — este endpoint existe
 * para permitir correções administrativas (ex.: valor transcrito errado).
 */
public record AtualizarAuditoriaRequestDTO(
        String valorAnterior,
        String valorNovo,
        String campoAlterado
) {}
