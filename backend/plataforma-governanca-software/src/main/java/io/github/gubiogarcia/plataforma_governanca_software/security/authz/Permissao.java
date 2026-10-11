package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

/**
 * Permissões da plataforma. Os nomes são os mesmos das roles de realm do Keycloak
 * (realm-export.json), mas o backend NÃO lê essas roles do token: a permissão
 * efetiva sai do papel resolvido pelos grupos + {@link MatrizPermissoes}.
 */
public enum Permissao {

    // Organização
    ORG_CREATE_PROJECT, ORG_EDIT, ORG_INATIVAR, ORG_DELETE,
    ORG_INVITE_USER, ORG_VIEW_USERS, ORG_PROMOTE_USER, ORG_REMOVE_USER,

    // Projeto — metadados, ciclo de vida e participantes
    PROJETO_EDIT, PROJETO_INATIVAR, PROJETO_DELETE,
    PROJETO_VIEW_USERS, PROJETO_INVITE_USER, PROJETO_PROMOTE_USER, PROJETO_REMOVE_USER,

    // Requisitos
    REQ_CREATE, REQ_EDIT, REQ_DELETE, REQ_VIEW, REQ_COMMENT, REQ_APPROVE,
    REQ_REQUEST_APPROVAL, REQ_REQUEST_REJECTION, REQ_REQUEST_CHANGE,

    // Wiki
    WIKI_VIEW, WIKI_EDIT, WIKI_COMMENT,

    // Eventos
    EVENTO_VIEW, EVENTO_CREATE, EVENTO_EDIT, EVENTO_DELETE, EVENTO_APPROVE, EVENTO_REQUEST,

    // Arquivos
    ARQUIVO_VIEW, ARQUIVO_DOWNLOAD, ARQUIVO_UPLOAD, ARQUIVO_DELETE,

    // Analytics e auditoria
    ANALYTICS_VIEW, AUDIT_VIEW, AUDIT_HISTORICO_VIEW,

    // Modelagem de dados
    MER_VIEW, MER_EDIT, MER_EXPORT, MER_EXPORT_REQUEST,

    // Rastreabilidade
    RASTREABILIDADE_VIEW, RASTREABILIDADE_EDIT, RASTREABILIDADE_EXPORT, RASTREABILIDADE_EXPORT_REQUEST,

    // Solicitações de stakeholders
    SOLICITACAO_RESPONDER,

    // Plataforma (Admin da Plataforma, grupo /_admin)
    REF_DATA_EDIT
}
