package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

/**
 * Tipo da operação que um requisito realiza sobre o modelo de dados, gravada
 * em ImpactoDados. Mesmo princípio de
 * {@link io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria},
 * porém aplicado ao schema (entidade/atributo) em vez de a um campo qualquer.
 */
public enum TipoOperacaoImpacto {
    CRIA_ENTIDADE,
    ALTERA_ENTIDADE,
    REMOVE_ENTIDADE,
    CRIA_ATRIBUTO,
    ALTERA_ATRIBUTO,
    REMOVE_ATRIBUTO
}
