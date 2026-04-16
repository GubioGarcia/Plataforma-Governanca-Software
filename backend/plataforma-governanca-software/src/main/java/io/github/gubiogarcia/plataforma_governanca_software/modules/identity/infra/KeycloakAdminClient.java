package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import java.util.UUID;

public interface KeycloakAdminClient {

    UUID criarUsuario(String email, String nome, String senha);
    void atualizarUsuario(UUID keycloakId, String novoNome, String novoEmail);
    void redefinirSenha(UUID keycloakId, String novaSenha);
    void desabilitarUsuario(UUID keycloakId);
}