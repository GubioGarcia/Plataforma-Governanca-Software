package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.KeycloakUserInfo;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
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

    //Recebe o JWT validado pelo Spring Security,
    @Transactional
    public UsuarioResponseDTO resolverUsuario(Jwt jwt) {
        KeycloakUserInfo keycloakInfo = extrairInfoKeycloak(jwt);
        Usuario usuario = sincronizarUsuario(keycloakInfo);
        return mapToResponseDTO(usuario, keycloakInfo.roles());
    }

    //Extrai os dados relevantes do JWT emitido pelo Keycloak.
    private KeycloakUserInfo extrairInfoKeycloak(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");

        String nomeCompleto = jwt.getClaimAsString("name");
        if (nomeCompleto == null || nomeCompleto.isBlank()) {
            String firstName = jwt.getClaimAsString("given_name");
            String lastName  = jwt.getClaimAsString("family_name");
            nomeCompleto = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
        }

        List<String> roles = extrairRoles(jwt);

        return new KeycloakUserInfo(keycloakId, email, nomeCompleto, roles);
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

    //Busca o usuário pelo ID do Keycloak (external_identity_id). Se não encontrar, tenta pelo e-mail (migração). Se não existir, cria um novo registro.
    private Usuario sincronizarUsuario(KeycloakUserInfo info) {
        return usuarioRepository
                .findByExternalIdentityId(info.keycloakId())
                .orElseGet(() -> usuarioRepository
                        .findByEmail(info.email())
                        .map(u -> vincularKeycloakId(u, info))
                        .orElseGet(() -> criarNovoUsuario(info))
                );
    }

    private Usuario vincularKeycloakId(Usuario usuario, KeycloakUserInfo info) {
        log.info("Vinculando keycloakId {} ao usuário existente {}", info.keycloakId(), usuario.getId());
        usuario.setExternalIdentityId(info.keycloakId());
        usuario.setDataAtualizacao(Instant.now());
        return usuarioRepository.save(usuario);
    }

    private Usuario criarNovoUsuario(KeycloakUserInfo info) {
        log.info("Criando novo usuário para keycloakId {}", info.keycloakId());
        Usuario novo = Usuario.builder()
                .externalIdentityId(info.keycloakId())
                .email(info.email())
                .nome(info.nome())
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();
        return usuarioRepository.save(novo);
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
}
