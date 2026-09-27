package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Slf4j
@Component
public class KeycloakTokenClientImpl implements KeycloakTokenClient {

    private final String tokenUrl;
    private final String logoutUrl;
    private final String clientId;
    private final String clientSecret;

    private final RestClient restClient;

    public KeycloakTokenClientImpl(
            @Value("${keycloak.token-url}")     String tokenUrl,
            @Value("${keycloak.client-id}")     String clientId,
            @Value("${keycloak.client-secret}") String clientSecret
    ) {
        this.tokenUrl     = tokenUrl;
        this.logoutUrl    = tokenUrl.replaceFirst("/token$", "/logout");
        this.clientId     = clientId;
        this.clientSecret = clientSecret;
        this.restClient   = RestClient.create();
    }

    @Override
    public boolean credenciaisValidas(String username, String senha) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type",    "password");
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);
        body.add("username",      username);
        body.add("password",      senha);

        var response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                // 400 (invalid_grant) e 401 (invalid credentials) = credenciais recusadas
                .onStatus(status -> status.value() == 400 || status.value() == 401, (req, res) -> {})
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao validar credenciais no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .toEntity(Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            return false;
        }

        encerrarSessao(response.getBody());
        return true;
    }

    /**
     * A conferência abre uma sessão no Keycloak; encerra em seguida para não
     * deixar sessões órfãs. Falha aqui não invalida a conferência.
     */
    private void encerrarSessao(Map<?, ?> tokenResponse) {
        Object refreshToken = tokenResponse != null ? tokenResponse.get("refresh_token") : null;
        if (refreshToken == null) return;

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken.toString());

        try {
            restClient.post()
                    .uri(logoutUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Não foi possível encerrar a sessão aberta na conferência de senha: {}", ex.getMessage());
        }
    }
}
