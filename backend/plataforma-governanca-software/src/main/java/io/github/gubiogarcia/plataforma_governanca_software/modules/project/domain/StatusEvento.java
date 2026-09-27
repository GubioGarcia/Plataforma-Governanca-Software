package io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain;

/**
 * Situação do evento. Criado por Dono/Gestor → APROVADO. Pedido por stakeholder
 * (solicitação EVENTO) → SOLICITADO até ser atendido (APROVADO) ou recusado (REJEITADO).
 */
public enum StatusEvento {
    SOLICITADO,
    APROVADO,
    REJEITADO
}
