package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import java.util.Optional;

/** Operações de sessão no endpoint de token do Keycloak (client da API, confidencial). */
public interface KeycloakTokenClient {

    /** Tokens devolvidos pelo Keycloak; os prazos estão em segundos. */
    record Tokens(String accessToken, long expiresIn, String refreshToken, long refreshExpiresIn) {}

    /** Login por senha (password grant). Vazio quando as credenciais são recusadas. */
    Optional<Tokens> autenticar(String username, String senha);

    /** Renova a sessão com o refresh token. Vazio quando o refresh token é inválido ou expirou. */
    Optional<Tokens> renovar(String refreshToken);

    /** Encerra a sessão do refresh token no Keycloak. Falhas são apenas registradas no log. */
    void encerrarSessao(String refreshToken);

    /**
     * Confere usuário e senha e encerra a sessão aberta pela conferência.
     * Retorna false quando as credenciais são recusadas.
     */
    default boolean credenciaisValidas(String username, String senha) {
        Optional<Tokens> tokens = autenticar(username, senha);
        tokens.ifPresent(t -> encerrarSessao(t.refreshToken()));
        return tokens.isPresent();
    }
}
