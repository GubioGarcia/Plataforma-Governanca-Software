package io.github.gubiogarcia.plataforma_governanca_software.config;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.RevogacaoTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final java.util.Set<String> ROTAS_DE_SESSAO =
            java.util.Set.of("/api/auth/login", "/api/auth/refresh", "/api/auth/logout");

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Value("${keycloak.issuer}")
    private String keycloakIssuer;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // SWAGGER
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Rotas públicas do módulo de identidade
                        .requestMatchers(HttpMethod.POST,  "/api/auth/login").permitAll()
                        // Sessão pelo cookie HttpOnly do refresh token (não pelo access token)
                        .requestMatchers(HttpMethod.POST,  "/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.POST,  "/api/usuario/cadastrar").permitAll()
                        // Qualquer outra rota exige autenticação
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .bearerTokenResolver(request -> {
                            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                                return null;
                            }
                            // Rotas de sessão ignoram o header Authorization: o front o envia junto,
                            // e um token expirado/revogado barraria (401) justamente o refresh.
                            if (ROTAS_DE_SESSAO.contains(request.getRequestURI())) {
                                return null;
                            }
                            return new DefaultBearerTokenResolver().resolve(request);
                        })
                );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(RevogacaoTokenService revogacaoTokenService) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        OAuth2TokenValidator<Jwt> validators = new DelegatingOAuth2TokenValidator<>(List.of(
                new JwtTimestampValidator(),
                new JwtIssuerValidator(keycloakIssuer),
                // Token emitido antes de uma mudança de grupos do usuário → 401 (front renova a sessão)
                new RevogacaoTokenValidator(revogacaoTokenService)
        ));
        decoder.setJwtValidator(validators);
        return decoder;
    }

    /**
     * Conversor padrão: as roles de realm do token NÃO viram authorities. A decisão
     * de acesso é feita pelo AutorizacaoService a partir do claim "groups" — a lista
     * plana realm_access.roles vazaria permissão de um projeto para outro.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        return new JwtAuthenticationConverter();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        // Nome do arquivo nas exportações (CSV) legível pelo front em dev (outra origem)
        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}