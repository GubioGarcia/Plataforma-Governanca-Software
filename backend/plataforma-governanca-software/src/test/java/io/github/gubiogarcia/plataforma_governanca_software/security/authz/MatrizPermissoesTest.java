package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Garante que a matriz estática do backend e as composites do realm-export.json
 * (documentação no Keycloak) continuem iguais. Se alguém mudar uma sem a outra,
 * este teste falha.
 *
 * O arquivo fica fora do módulo (infrastructure/); se não estiver disponível
 * (build isolado), o teste é ignorado.
 */
class MatrizPermissoesTest {

    private static final File REALM = new File("../../infrastructure/docker/keycloak/realm-export.json");

    private static Map<String, Set<String>> composites;
    private static Set<String> folhas;

    @BeforeAll
    static void carregarRealm() {
        assumeTrue(REALM.exists(), "realm-export.json não encontrado em " + REALM.getAbsolutePath());
        JsonNode roles = new ObjectMapper().readTree(REALM).path("roles").path("realm");

        composites = new HashMap<>();
        for (JsonNode role : roles) {
            Set<String> filhos = new HashSet<>();
            role.path("composites").path("realm").forEach(n -> filhos.add(n.asText()));
            composites.put(role.path("name").asText(), filhos);
        }
        folhas = composites.entrySet().stream()
                .filter(e -> e.getValue().isEmpty())
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    /** Permissões (roles folha) alcançadas por uma role composta do realm. */
    private static Set<String> efetivas(String role) {
        Set<String> resultado = new TreeSet<>();
        Deque<String> pilha = new ArrayDeque<>(composites.get(role));
        while (!pilha.isEmpty()) {
            String r = pilha.pop();
            if (folhas.contains(r)) resultado.add(r);
            else pilha.addAll(composites.get(r));
        }
        return resultado;
    }

    private static Set<String> nomes(Set<Permissao> permissoes) {
        return permissoes.stream().map(Enum::name).collect(Collectors.toCollection(TreeSet::new));
    }

    private static Set<String> semOrg(Set<String> p) {
        return p.stream().filter(n -> !n.startsWith("ORG_")).collect(Collectors.toCollection(TreeSet::new));
    }

    private static Set<String> soOrg(Set<String> p) {
        return p.stream().filter(n -> n.startsWith("ORG_")).collect(Collectors.toCollection(TreeSet::new));
    }

    @Test
    void enumDePermissoes_eIgualAsRolesFolhaDoRealm() {
        assertThat(nomes(EnumSet.allOf(Permissao.class))).isEqualTo(new TreeSet<>(folhas));
    }

    @Test
    void papeisDeProjeto_batemComAsCompositesDoRealm() {
        assertThat(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.DONO)))).isEqualTo(efetivas("PROJECT_OWNER"));
        assertThat(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.GESTOR)))).isEqualTo(efetivas("PROJECT_MANAGER"));
        assertThat(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.STAKEHOLDER_TECNICO)))).isEqualTo(efetivas("STAKEHOLDER_TECHNICAL"));
        assertThat(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.STAKEHOLDER_CLIENTE)))).isEqualTo(efetivas("STAKEHOLDER_CLIENT"));
    }

    @Test
    void papeisDeOrganizacao_batemComAsCompositesDoRealm_incluindoHerancaNosProjetos() {
        // Parte "organização" de cada papel
        assertThat(nomes(MatrizPermissoes.daOrganizacao(PapelOrganizacao.DONO))).isEqualTo(soOrg(efetivas("ORG_OWNER")));
        assertThat(nomes(MatrizPermissoes.daOrganizacao(PapelOrganizacao.GESTOR))).isEqualTo(soOrg(efetivas("ORG_MANAGER")));
        assertThat(nomes(MatrizPermissoes.daOrganizacao(PapelOrganizacao.MEMBRO))).isEqualTo(soOrg(efetivas("ORG_MEMBER")));

        // Herança nos projetos: Dono → Dono (D), Gestor → Gestor (D13), Membro → Técnico (D10)
        assertThat(semOrg(efetivas("ORG_OWNER"))).isEqualTo(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.DONO))));
        assertThat(semOrg(efetivas("ORG_MANAGER"))).isEqualTo(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.GESTOR))));
        assertThat(semOrg(efetivas("ORG_MEMBER"))).isEqualTo(nomes(MatrizPermissoes.doProjeto(List.of(PapelProjeto.STAKEHOLDER_TECNICO))));
    }

    @Test
    void adminDaPlataforma_bateComOrealm() {
        assertThat(nomes(MatrizPermissoes.ADMIN_PLATAFORMA)).isEqualTo(efetivas("PLATFORM_ADMIN"));
    }
}
