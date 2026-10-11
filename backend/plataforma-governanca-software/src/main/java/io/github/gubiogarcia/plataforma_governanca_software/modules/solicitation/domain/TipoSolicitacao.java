package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain;

import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;

/** Tipos de pedido de stakeholder (D12) e a permissão exigida para fazer cada um. */
public enum TipoSolicitacao {
    ALTERACAO_REQUISITO(Permissao.REQ_REQUEST_CHANGE),
    REPROVACAO_REQUISITO(Permissao.REQ_REQUEST_REJECTION),
    APROVACAO_REQUISITO(Permissao.REQ_REQUEST_APPROVAL),
    EVENTO(Permissao.EVENTO_REQUEST),
    EXPORT_MER(Permissao.MER_EXPORT_REQUEST),
    EXPORT_RASTREABILIDADE(Permissao.RASTREABILIDADE_EXPORT_REQUEST);

    private final Permissao permissaoParaSolicitar;

    TipoSolicitacao(Permissao permissaoParaSolicitar) {
        this.permissaoParaSolicitar = permissaoParaSolicitar;
    }

    public Permissao permissaoParaSolicitar() {
        return permissaoParaSolicitar;
    }

    public boolean sobreRequisito() {
        return this == ALTERACAO_REQUISITO || this == REPROVACAO_REQUISITO || this == APROVACAO_REQUISITO;
    }

    public boolean exportacao() {
        return this == EXPORT_MER || this == EXPORT_RASTREABILIDADE;
    }
}
