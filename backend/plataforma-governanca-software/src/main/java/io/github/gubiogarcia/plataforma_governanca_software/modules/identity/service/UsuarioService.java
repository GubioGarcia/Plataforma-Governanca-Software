package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AlterarSenhaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AtualizarPerfilRequestDTO;
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

        if (usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException(request.email());
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();
        usuario = usuarioRepository.save(usuario);

        UUID keycloakId;
        try {
            keycloakId = keycloakAdminClient.criarUsuario(
                    request.email(),
                    request.nome(),
                    request.senha()
            );
        } catch (KeycloakAdminException ex) {
            log.error("Falha ao criar usuário no Keycloak para e-mail {}: {}", request.email(), ex.getMessage());
            throw new CadastroKeycloakException("Falha ao registrar o usuário no servidor de autenticação. Tente novamente.", ex);
        }

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

    @Transactional
    public UsuarioResponseDTO atualizarPerfil(Jwt jwt, AtualizarPerfilRequestDTO request) {
        KeycloakUserInfo keycloakInfo = extrairInfoKeycloak(jwt);

        Usuario usuario = usuarioRepository
                .findByExternalIdentityId(keycloakInfo.keycloakId())
                .orElseThrow(() -> new UsuarioNaoEncontradoException(
                        "Usuário não encontrado. Realize o cadastro na plataforma."));

        // Valida conflito de e-mail se o e-mail alterado é diferente do atual
        String novoEmail = request.email();
        if (!usuario.getEmail().equalsIgnoreCase(novoEmail)
                && usuarioRepository.existsByEmail(novoEmail)) {
            throw new EmailJaCadastradoException(novoEmail);
        }

        String novoNome = request.nome();

        // Replica no Keycloak (nome + e-mail)
        try {
            keycloakAdminClient.atualizarUsuario(usuario.getExternalIdentityId(), novoNome, novoEmail);
        } catch (KeycloakAdminException ex) {
            log.error("Falha ao atualizar usuário {} no Keycloak: {}", usuario.getId(), ex.getMessage());
            throw new AtualizacaoKeycloakException("Falha ao atualizar dados no servidor de autenticação. Tente novamente.", ex);
        }

        usuario.setNome(novoNome);
        usuario.setEmail(novoEmail);
        usuario.setUrlMidiaPerfil(request.urlMidiaPerfil());
        usuario.setDataAtualizacao(Instant.now());
        usuario = usuarioRepository.save(usuario);

        log.info("Perfil do usuário {} atualizado com sucesso.", usuario.getId());
        return mapToResponseDTO(usuario, keycloakInfo.roles());
    }

    @Transactional
    public void alterarSenha(AlterarSenhaRequestDTO request) {

        if (!request.novaSenha().equals(request.confirmacaoSenha())) {
            throw new SenhasNaoConferemException("A nova senha e a confirmação não conferem.");
        }

        Usuario usuario = usuarioRepository
                .findByEmail(request.email())
                .orElseThrow(() -> new UsuarioNaoEncontradoException(
                        "Nenhum usuário encontrado com o e-mail informado."));

        try {
            keycloakAdminClient.redefinirSenha(usuario.getExternalIdentityId(), request.novaSenha());
        } catch (KeycloakAdminException ex) {
            log.error("Falha ao redefinir senha no Keycloak para o usuário {}: {}", usuario.getId(), ex.getMessage());
            throw new AtualizacaoKeycloakException("Falha ao redefinir a senha no servidor de autenticação. Tente novamente.", ex);
        }

        usuario.setDataAtualizacao(Instant.now());
        usuarioRepository.save(usuario);

        log.info("Senha alterada com sucesso para o usuário {}.", usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarTodos(Boolean ativo) {
        List<Usuario> usuarios = (ativo == null)
                ? usuarioRepository.findAll()
                : usuarioRepository.findAllByAtivo(ativo);

        return usuarios.stream()
                .map(u -> mapToResponseDTO(u, Collections.emptyList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNaoEncontradoException(
                        "Nenhum usuário encontrado com o id: " + id));
        return mapToResponseDTO(usuario, Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNaoEncontradoException(
                        "Nenhum usuário encontrado com o e-mail: " + email));
        return mapToResponseDTO(usuario, Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> buscarPorNome(String nome) {
        List<Usuario> usuarios = usuarioRepository.findByNomeContainingIgnoreCase(nome);
        if (usuarios.isEmpty()) {
            throw new UsuarioNaoEncontradoException(
                    "Nenhum usuário encontrado com o nome: " + nome);
        }
        return usuarios.stream()
                .map(u -> mapToResponseDTO(u, Collections.emptyList()))
                .toList();
    }

    @Transactional
    public void inativar(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNaoEncontradoException(
                        "Nenhum usuário encontrado com o id: " + id));

        if (Boolean.FALSE.equals(usuario.getAtivo())) {
            throw new UsuarioJaInativoException(id);
        }

        try {
            keycloakAdminClient.desabilitarUsuario(usuario.getExternalIdentityId());
        } catch (KeycloakAdminException ex) {
            log.error("Falha ao desabilitar usuário {} no Keycloak: {}", id, ex.getMessage());
            throw new AtualizacaoKeycloakException(
                    "Falha ao inativar o usuário no servidor de autenticação. Tente novamente.", ex);
        }

        usuario.setAtivo(false);
        usuario.setDataAtualizacao(Instant.now());
        usuarioRepository.save(usuario);

        log.info("Usuário {} inativado com sucesso.", id);
    }

    // Helpers privados

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

    public static class UsuarioJaInativoException extends RuntimeException {
        public UsuarioJaInativoException(UUID id) {
            super("O usuário com id " + id + " já está inativo.");
        }
    }

    // Exceções de domínio

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

    public static class AtualizacaoKeycloakException extends RuntimeException {
        public AtualizacaoKeycloakException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class SenhasNaoConferemException extends RuntimeException {
        public SenhasNaoConferemException(String message) {
            super(message);
        }
    }
}