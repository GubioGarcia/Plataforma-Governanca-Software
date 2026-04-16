package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.config.JwtDecoderProvider;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final UsuarioService usuarioService;

    @Value("${keycloak.token-url}")
    private String tokenUrl;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    public LoginResponseDTO login(LoginRequestDTO request) {

        // Monta request para o Keycloak
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", request.email());
        body.add("password", request.senha());
        body.add("grant_type", "password");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response;

        try {
            response = restTemplate.postForEntity(tokenUrl, entity, Map.class);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Credenciais inválidas");
        }

        String accessToken = (String) response.getBody().get("access_token");

        // Decodifica JWT
        Jwt jwt = JwtDecoderProvider.decode(accessToken);

        // Reutiliza seu service atual
        UsuarioResponseDTO usuario = usuarioService.resolverUsuario(jwt);

        return new LoginResponseDTO(accessToken, usuario);
    }
}