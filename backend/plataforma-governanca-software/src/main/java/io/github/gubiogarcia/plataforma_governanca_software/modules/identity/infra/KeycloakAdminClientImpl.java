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

    @Override
    public UUID criarUsuario(String email, String nome, String senha) {
        String adminToken = obterTokenAdmin();
        return criarUsuarioNoKeycloak(adminToken, email, nome, senha);
    }

    @Override
    public void atualizarUsuario(UUID keycloakId, String novoNome, String novoEmail) {
        String adminToken = obterTokenAdmin();
        atualizarUsuarioNoKeycloak(adminToken, keycloakId, novoNome, novoEmail);
    }

    @Override
    public void redefinirSenha(UUID keycloakId, String novaSenha) {
        String adminToken = obterTokenAdmin();
        redefinirSenhaNoKeycloak(adminToken, keycloakId, novaSenha);
    }

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

    private UUID criarUsuarioNoKeycloak(String adminToken, String email,
                                        String nome, String senha) {

        String usersUrl = serverUrl + "/admin/realms/" + realm + "/users";

        Map<String, Object> credential = Map.of(
                "type",      "password",
                "value",     senha,
                "temporary", false
        );

        Map<String, Object> payload = Map.of(
                "username",        email,
                "email",           email,
                "firstName",       nome,
                "lastName",        nome,
                "enabled",         true,
                "emailVerified",   true,
                "requiredActions", List.of(),
                "credentials",     List.of(credential)
        );

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

        var location = responseSpec.getHeaders().getLocation();
        if (location == null) {
            throw new KeycloakAdminException("Keycloak não retornou o header Location após criar o usuário", 500);
        }

        String path = location.getPath();
        String keycloakId = path.substring(path.lastIndexOf('/') + 1);
        log.info("Usuário criado no Keycloak com ID: {}", keycloakId);

        return UUID.fromString(keycloakId);
    }

    private void atualizarUsuarioNoKeycloak(String adminToken, UUID keycloakId,String novoNome, String novoEmail) {

        String userUrl = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

        Map<String, Object> payload = Map.of(
                "firstName", novoNome,
                "lastName",  novoNome,
                "email",     novoEmail,
                "username",  novoEmail
        );

        restClient.put()
                .uri(userUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .onStatus(status -> status.value() == 404, (req, res) -> {
                    throw new KeycloakAdminException(
                            "Usuário não encontrado no Keycloak: " + keycloakId, 404
                    );
                })
                .onStatus(status -> status.value() == 409, (req, res) -> {
                    throw new KeycloakAdminException(
                            "Já existe um usuário com este e-mail no Keycloak: " + novoEmail, 409
                    );
                })
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao atualizar usuário no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .toBodilessEntity();

        log.info("Usuário {} atualizado no Keycloak (nome={}, email={})", keycloakId, novoNome, novoEmail);
    }

    private void redefinirSenhaNoKeycloak(String adminToken, UUID keycloakId, String novaSenha) {

        String resetUrl = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakId + "/reset-password";

        Map<String, Object> credential = Map.of(
                "type",      "password",
                "value",     novaSenha,
                "temporary", false
        );

        restClient.put()
                .uri(resetUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(credential)
                .retrieve()
                .onStatus(status -> status.value() == 404, (req, res) -> {
                    throw new KeycloakAdminException(
                            "Usuário não encontrado no Keycloak ao redefinir senha: " + keycloakId, 404
                    );
                })
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao redefinir senha no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .toBodilessEntity();

        log.info("Senha redefinida no Keycloak para o usuário {}", keycloakId);
    }

    @Override
    public void desabilitarUsuario(UUID keycloakId) {
        String adminToken = obterTokenAdmin();
        desabilitarUsuarioNoKeycloak(adminToken, keycloakId);
    }

    private void desabilitarUsuarioNoKeycloak(String adminToken, UUID keycloakId) {
        String userUrl = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

        Map<String, Object> payload = Map.of("enabled", false);

        restClient.put()
                .uri(userUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .onStatus(status -> status.value() == 404, (req, res) -> {
                    throw new KeycloakAdminException(
                            "Usuário não encontrado no Keycloak: " + keycloakId, 404);
                })
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao desabilitar usuário no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();

        log.info("Usuário {} desabilitado no Keycloak.", keycloakId);
    }
}