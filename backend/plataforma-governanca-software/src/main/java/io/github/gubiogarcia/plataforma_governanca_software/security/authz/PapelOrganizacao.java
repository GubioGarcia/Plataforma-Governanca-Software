package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

/** Papel do usuário numa organização, resolvido pelos subgrupos /org-{id}/_dono|_gestores|_membros. */
public enum PapelOrganizacao {
    DONO,
    GESTOR,
    MEMBRO
}
