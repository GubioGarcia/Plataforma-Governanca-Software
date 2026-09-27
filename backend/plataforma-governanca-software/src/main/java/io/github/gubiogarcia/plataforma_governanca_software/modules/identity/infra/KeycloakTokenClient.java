package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

public interface KeycloakTokenClient {

    /**
     * Confere usuário e senha contra o Keycloak (password grant no client da API).
     * Retorna false quando as credenciais são recusadas; lança KeycloakAdminException
     * quando o Keycloak não responde como esperado.
     */
    boolean credenciaisValidas(String username, String senha);
}
