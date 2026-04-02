package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Implementação do KeycloakAdminClient usando o RestClient do Spring 6.
 *
 * Fluxo:
 *  1. Obtém um token de serviço (client_credentials) do Keycloak.
 *  2. Usa esse token para chamar o Admin REST API e criar o usuário.
 *  3. Extrai o UUID do usuário criado a partir do header "Location" da resposta 201.
 *
 * Propriedades necessárias no application.properties:
 *   keycloak.admin.server-url       = http://keycloak:8080
 *   keycloak.admin.realm            = plataforma_discovery
 *   keycloak.admin.client-id        = plataforma-backend           (client com role "manage-users")
 *   keycloak.admin.client-secret    = <secret do client>
 */
@Slf4j
@Component
public class KeycloakAdminClientImpl implements KeycloakAdminClient {

    private final String serverUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private final RestClient restClient;

    public KeycloakAdminClientImpl(
            @Value("${keycloak.admin.server-url}") String serverUrl,
            @Value("${keycloak.admin.realm}")       String realm,
            @Value("${keycloak.admin.client-id}")   String clientId,
            @Value("${keycloak.admin.client-secret}") String clientSecret
    ) {
        this.serverUrl    = serverUrl;
        this.realm        = realm;
        this.clientId     = clientId;
        this.clientSecret = clientSecret;
        this.restClient   = RestClient.create();
    }

    // -------------------------------------------------------------------------
    // Implementação pública
    // -------------------------------------------------------------------------

    @Override
    public UUID criarUsuario(String email, String nome, String senha) {
        String adminToken = obterTokenAdmin();
        return criarUsuarioNoKeycloak(adminToken, email, nome, senha);
    }

    // -------------------------------------------------------------------------
    // Passos internos
    // -------------------------------------------------------------------------

    /**
     * Passo 1 — obtém o access_token via client_credentials.
     */
    private String obterTokenAdmin() {
        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type",    "client_credentials");
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao obter token admin do Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .body(Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new KeycloakAdminException("Resposta do token admin não contém access_token", 500);
        }

        return (String) response.get("access_token");
    }

    /**
     * Passo 2 — cria o usuário via Admin REST API.
     * Retorna o UUID extraído do header Location da resposta 201.
     */
    private UUID criarUsuarioNoKeycloak(String adminToken, String email,
                                        String nome, String senha) {

        String usersUrl = serverUrl + "/admin/realms/" + realm + "/users";

        // Monta o payload conforme a representação do Keycloak
        Map<String, Object> credential = Map.of(
                "type",      "password",
                "value",     senha,
                "temporary", false
        );

        Map<String, Object> payload = Map.of(
                "username",        email,
                "email",           email,
                "firstName",       nome,
                "lastName",       nome,
                "enabled",         true,
                "emailVerified",   true,
                "requiredActions", List.of(),
                "credentials",     List.of(credential)
        );

        // O Keycloak retorna 201 com o Location header apontando para o novo usuário
        var responseSpec = restClient.post()
                .uri(usersUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .onStatus(status -> status.value() == 409, (req, res) -> {
                    throw new KeycloakAdminException(
                            "Já existe um usuário com este e-mail no Keycloak: " + email, 409
                    );
                })
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao criar usuário no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .toBodilessEntity();

        // Extrai o UUID do header Location
        // Ex: http://keycloak:8080/admin/realms/plataforma_discovery/users/550e8400-e29b-41d4-a716-446655440000
        var location = responseSpec.getHeaders().getLocation();
        if (location == null) {
            throw new KeycloakAdminException("Keycloak não retornou o header Location após criar o usuário", 500);
        }

        String path = location.getPath();
        String keycloakId = path.substring(path.lastIndexOf('/') + 1);
        log.info("Usuário criado no Keycloak com ID: {}", keycloakId);

        return UUID.fromString(keycloakId);
    }
}