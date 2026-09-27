package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

import java.util.UUID;

public interface KeycloakAdminClient {

    UUID criarUsuario(String email, String nome, String senha);

    void atualizarUsuario(UUID keycloakId, String novoNome, String novoEmail);

    void redefinirSenha(UUID keycloakId, String novaSenha);

    void desabilitarUsuario(UUID keycloakId);

    // ── Grupos ────────────────────────────────────────────────────────────────

    /** Cria um grupo de topo. Se já existir um com o mesmo nome, devolve o id dele. */
    UUID criarGrupo(String nome);

    /** Cria um subgrupo. Se o pai já tiver um filho com o mesmo nome, devolve o id dele. */
    UUID criarSubgrupo(UUID grupoPaiId, String nome);

    /** Exclui o grupo e todos os subgrupos. Grupo inexistente é ignorado. */
    void excluirGrupo(UUID grupoId);

    void adicionarMembro(UUID usuarioKeycloakId, UUID grupoId);

    /** Mapeia uma role de realm no grupo (todos os membros passam a tê-la no token). */
    void mapearRoleNoGrupo(UUID grupoId, String nomeRole);
}
