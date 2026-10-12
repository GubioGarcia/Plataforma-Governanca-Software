package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

/**
 * Cardinalidade de um RelacionamentoEntidade (FK entre duas entidades de
 * negócio do projeto). Espelha o padrão de enum tipado de
 * {@link io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito}.
 */
public enum TipoRelacionamentoEntidade {
    UM_PARA_UM,
    UM_PARA_MUITOS,
    MUITOS_PARA_MUITOS
}
