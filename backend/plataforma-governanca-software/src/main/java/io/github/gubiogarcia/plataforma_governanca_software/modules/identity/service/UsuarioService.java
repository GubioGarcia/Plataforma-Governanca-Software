package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.CadastroUsuarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.KeycloakUserInfo;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminException;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    @Transactional
    public UsuarioResponseDTO cadastrar(CadastroUsuarioRequestDTO request) {

        // 1. Verificação de e-mail duplicado
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException(request.email());
        }

        // 2. Persiste o usuário localmente (sem externalIdentityId)
        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();
        usuario = usuarioRepository.save(usuario);

        // 3. Cria no Keycloak — pode lançar KeycloakAdminException
        UUID keycloakId;
        try {
            keycloakId = keycloakAdminClient.criarUsuario(
                    request.email(),
                    request.nome(),
                    request.senha()
            );
        } catch (KeycloakAdminException ex) {
            // Força rollback lançando uma runtime exception com mensagem amigável
            log.error("Falha ao criar usuário no Keycloak para e-mail {}: {}", request.email(), ex.getMessage());
            throw new CadastroKeycloakException("Falha ao registrar o usuário no servidor de autenticação. Tente novamente.", ex);
        }

        // 4. Vincula o ID do Keycloak ao registro local
        usuario.setExternalIdentityId(keycloakId);
        usuario.setDataAtualizacao(Instant.now());
        usuario = usuarioRepository.save(usuario);

        log.info("Usuário {} cadastrado com sucesso. ID local: {}, Keycloak ID: {}",
                request.email(), usuario.getId(), keycloakId);

        return mapToResponseDTO(usuario, Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO resolverUsuario(Jwt jwt) {
        KeycloakUserInfo keycloakInfo = extrairInfoKeycloak(jwt);

        Usuario usuario = usuarioRepository
                .findByExternalIdentityId(keycloakInfo.keycloakId())
                .orElseThrow(() -> {
                    log.warn("Usuário autenticado via Keycloak (sub={}) não encontrado no banco.",
                            keycloakInfo.keycloakId());
                    return new UsuarioNaoEncontradoException(
                            "Usuário não encontrado. Realize o cadastro na plataforma.");
                });

        return mapToResponseDTO(usuario, keycloakInfo.roles());
    }

    private KeycloakUserInfo extrairInfoKeycloak(Jwt jwt) {
        UUID keycloakId  = UUID.fromString(jwt.getSubject());
        String email     = jwt.getClaimAsString("email");
        String nome      = jwt.getClaimAsString("given_name");
        List<String> roles = extrairRoles(jwt);
        return new KeycloakUserInfo(keycloakId, email, nome, roles);
    }

    @SuppressWarnings("unchecked")
    private List<String> extrairRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return Collections.emptyList();
        Object roles = realmAccess.get("roles");
        if (roles instanceof List<?> lista) {
            return lista.stream()
                    .filter(r -> r instanceof String)
                    .map(r -> (String) r)
                    .toList();
        }
        return Collections.emptyList();
    }

    private UsuarioResponseDTO mapToResponseDTO(Usuario usuario, List<String> roles) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getExternalIdentityId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getAtivo(),
                usuario.getDataCriacao(),
                usuario.getUrlMidiaPerfil(),
                roles
        );
    }

    public static class EmailJaCadastradoException extends RuntimeException {
        public EmailJaCadastradoException(String email) {
            super("Já existe um usuário cadastrado com o e-mail: " + email);
        }
    }

    public static class UsuarioNaoEncontradoException extends RuntimeException {
        public UsuarioNaoEncontradoException(String message) {
            super(message);
        }
    }

    public static class CadastroKeycloakException extends RuntimeException {
        public CadastroKeycloakException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}