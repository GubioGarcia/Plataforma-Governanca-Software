package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Optional;

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
        // HttpURLConnection em vez do HttpClient do JDK (padrão do RestClient): o token-url
        // usa o nome do container "idprovider_keycloak", e o HttpClient rejeita host com "_".
        this.restClient   = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    @Override
    public Optional<Tokens> autenticar(String username, String senha) {
        MultiValueMap<String, String> body = formularioDoClient();
        body.add("grant_type", "password");
        body.add("username",   username);
        body.add("password",   senha);
        return pedirTokens(body, "autenticar");
    }

    @Override
    public Optional<Tokens> renovar(String refreshToken) {
        MultiValueMap<String, String> body = formularioDoClient();
        body.add("grant_type",    "refresh_token");
        body.add("refresh_token", refreshToken);
        return pedirTokens(body, "renovar a sessão");
    }

    @Override
    public void encerrarSessao(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;

        MultiValueMap<String, String> body = formularioDoClient();
        body.add("refresh_token", refreshToken);
        try {
            restClient.post()
                    .uri(logoutUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Não foi possível encerrar a sessão no Keycloak: {}", ex.getMessage());
        }
    }

    /** POST no endpoint de token. 400/401 (invalid_grant) = recusado → vazio; outros erros → exceção. */
    private Optional<Tokens> pedirTokens(MultiValueMap<String, String> body, String acao) {
        var response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .onStatus(status -> status.value() == 400 || status.value() == 401, (req, res) -> {})
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao " + acao + " no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value()
                    );
                })
                .toEntity(Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return Optional.empty();
        }
        Map<?, ?> t = response.getBody();
        return Optional.of(new Tokens(
                (String) t.get("access_token"),
                numero(t.get("expires_in")),
                (String) t.get("refresh_token"),
                numero(t.get("refresh_expires_in"))));
    }

    private MultiValueMap<String, String> formularioDoClient() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);
        return body;
    }

    private static long numero(Object valor) {
        return valor instanceof Number n ? n.longValue() : 0L;
    }
}
