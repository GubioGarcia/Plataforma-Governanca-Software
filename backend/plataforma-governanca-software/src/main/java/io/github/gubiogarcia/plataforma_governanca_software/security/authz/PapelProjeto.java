package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

/**
 * Papel do usuário num projeto. Um usuário pode ter mais de um papel no mesmo
 * projeto (ex.: stakeholder técnico e cliente — D9); a permissão efetiva é a união.
 */
public enum PapelProjeto {
    DONO,
    GESTOR,
    STAKEHOLDER_TECNICO,
    STAKEHOLDER_CLIENTE
}
