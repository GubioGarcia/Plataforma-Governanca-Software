package io.github.gubiogarcia.plataforma_governanca_software.support;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Coloca no SecurityContext um JWT com os grupos informados — é de onde o
 * AutorizacaoService lê os papéis. Os testes de service chamam os métodos
 * diretamente (sem HTTP), então o contexto precisa ser montado à mão.
 */
public final class AutenticacaoTeste {

    private AutenticacaoTeste() {}

    public static void comGrupos(UUID keycloakId, String... grupos) {
        Jwt jwt = Jwt.withTokenValue("token-teste")
                .header("alg", "none")
                .subject(keycloakId.toString())
                .claim("groups", List.of(grupos))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    public static void comoDonoDaOrganizacao(UUID keycloakId, UUID organizacaoId) {
        comGrupos(keycloakId, "/org-" + organizacaoId + "/_dono");
    }

    public static void comoAdminDaPlataforma(UUID keycloakId) {
        comGrupos(keycloakId, "/_admin");
    }

    /**
     * Acrescenta um grupo ao token atual — simula o token renovado depois que o
     * backend colocou o usuário num grupo (ex.: criador vira Dono da organização).
     */
    public static void adicionarGrupo(String grupo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken atual)) {
            throw new IllegalStateException("Nenhum usuário autenticado no contexto de teste.");
        }
        List<String> grupos = new ArrayList<>(atual.getToken().getClaimAsStringList("groups"));
        grupos.add(grupo);
        comGrupos(UUID.fromString(atual.getToken().getSubject()), grupos.toArray(String[]::new));
    }

    public static String grupoDonoOrganizacao(UUID organizacaoId) {
        return "/org-" + organizacaoId + "/_dono";
    }

    public static String grupoProjeto(UUID organizacaoId, UUID projetoId, String subgrupo) {
        return "/org-" + organizacaoId + "/proj-" + projetoId + "/" + subgrupo;
    }

    public static void limpar() {
        SecurityContextHolder.clearContext();
    }
}
