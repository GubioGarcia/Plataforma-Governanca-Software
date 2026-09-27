package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class KeycloakAdminClientImpl implements KeycloakAdminClient {

    private final String serverUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private final RestClient restClient;

    private String  tokenAdmin;
    private Instant tokenAdminExpiraEm = Instant.EPOCH;

    /** Representações das roles de realm (necessárias para mapear role em grupo); não mudam em execução. */
    private final Map<String, Map<String, Object>> rolesPorNome = new ConcurrentHashMap<>();

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

    /**
     * Token da service account, reaproveitado até 30 s antes de expirar — criar a
     * estrutura de grupos de uma organização faz várias chamadas seguidas.
     */
    private synchronized String obterTokenAdmin() {
        if (tokenAdmin != null && Instant.now().isBefore(tokenAdminExpiraEm)) {
            return tokenAdmin;
        }
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

        long expiraEmSegundos = response.get("expires_in") instanceof Number n ? n.longValue() : 60L;
        tokenAdmin         = (String) response.get("access_token");
        tokenAdminExpiraEm = Instant.now().plusSeconds(Math.max(expiraEmSegundos - 30, 0));
        return tokenAdmin;
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

    @Override
    public void encerrarSessoes(UUID keycloakId) {
        restClient.post()
                .uri(adminUrl("/users/" + keycloakId + "/logout"))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao encerrar sessões do usuário " + keycloakId + " no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();

        log.info("Sessões do usuário {} encerradas no Keycloak.", keycloakId);
    }

    // ── Grupos ────────────────────────────────────────────────────────────────

    @Override
    public UUID criarGrupo(String nome) {
        UUID id = criarGrupoEm(adminUrl("/groups"), nome);
        return id != null ? id : buscarGrupoPorCaminho("/" + nome);
    }

    @Override
    public UUID criarSubgrupo(UUID grupoPaiId, String nome) {
        UUID id = criarGrupoEm(adminUrl("/groups/" + grupoPaiId + "/children"), nome);
        if (id != null) {
            return id;
        }
        Map<?, ?> pai = restClient.get()
                .uri(adminUrl("/groups/" + grupoPaiId))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Grupo pai não encontrado no Keycloak: " + grupoPaiId, res.getStatusCode().value());
                })
                .body(Map.class);
        return buscarGrupoPorCaminho(pai.get("path") + "/" + nome);
    }

    @Override
    public void excluirGrupo(UUID grupoId) {
        restClient.delete()
                .uri(adminUrl("/groups/" + grupoId))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> status.value() == 404, (req, res) -> {})
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao excluir grupo " + grupoId + " no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();

        log.info("Grupo {} excluído do Keycloak.", grupoId);
    }

    @Override
    public void adicionarMembro(UUID usuarioKeycloakId, UUID grupoId) {
        restClient.put()
                .uri(adminUrl("/users/" + usuarioKeycloakId + "/groups/" + grupoId))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao adicionar usuário " + usuarioKeycloakId + " ao grupo " + grupoId
                                    + " no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();

        log.info("Usuário {} adicionado ao grupo {} no Keycloak.", usuarioKeycloakId, grupoId);
    }

    @Override
    public void mapearRoleNoGrupo(UUID grupoId, String nomeRole) {
        Map<String, Object> role = rolesPorNome.computeIfAbsent(nomeRole, this::buscarRole);

        restClient.post()
                .uri(adminUrl("/groups/" + grupoId + "/role-mappings/realm"))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .contentType(MediaType.APPLICATION_JSON)
                .body(List.of(role))
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao mapear role " + nomeRole + " no grupo " + grupoId
                                    + " no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();
    }

    /** POST de criação de grupo; devolve o id (do header Location) ou null se o nome já existe (409). */
    private UUID criarGrupoEm(String url, String nome) {
        var resposta = restClient.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("name", nome))
                .retrieve()
                .onStatus(status -> status.value() == 409, (req, res) -> {})
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Falha ao criar grupo '" + nome + "' no Keycloak: HTTP " + res.getStatusCode(),
                            res.getStatusCode().value());
                })
                .toBodilessEntity();

        if (resposta.getStatusCode().value() == 409) {
            log.info("Grupo '{}' já existia no Keycloak; reaproveitando.", nome);
            return null;
        }

        URI location = resposta.getHeaders().getLocation();
        if (location == null) {
            throw new KeycloakAdminException("Keycloak não retornou o header Location após criar o grupo " + nome, 500);
        }
        String path = location.getPath();
        UUID id = UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
        log.info("Grupo '{}' criado no Keycloak com ID: {}", nome, id);
        return id;
    }

    private UUID buscarGrupoPorCaminho(String caminho) {
        Map<?, ?> grupo = restClient.get()
                .uri(adminUrl("/group-by-path" + caminho))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Grupo não encontrado no Keycloak: " + caminho, res.getStatusCode().value());
                })
                .body(Map.class);
        return UUID.fromString((String) grupo.get("id"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buscarRole(String nomeRole) {
        return restClient.get()
                .uri(adminUrl("/roles/" + nomeRole))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + obterTokenAdmin())
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new KeycloakAdminException(
                            "Role de realm não encontrada no Keycloak: " + nomeRole, res.getStatusCode().value());
                })
                .body(Map.class);
    }

    private String adminUrl(String caminho) {
        return serverUrl + "/admin/realms/" + realm + caminho;
    }
}