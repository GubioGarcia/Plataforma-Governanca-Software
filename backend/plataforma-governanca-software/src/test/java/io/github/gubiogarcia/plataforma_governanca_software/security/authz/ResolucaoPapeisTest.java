package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto.*;
import static io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao.*;
import static org.assertj.core.api.Assertions.assertThat;

/** Cenários de validação do doc de autorização (Passo 3, "Exemplos de validação"). */
class ResolucaoPapeisTest {

    private final UUID orgA = UUID.randomUUID(), orgB = UUID.randomUUID(), orgC = UUID.randomUUID(), orgD = UUID.randomUUID();
    private final UUID projA1 = UUID.randomUUID(), projB3 = UUID.randomUUID(), projB4 = UUID.randomUUID();
    private final UUID projC5 = UUID.randomUUID(), projC6 = UUID.randomUUID(), projD1 = UUID.randomUUID();

    private static String org(UUID o)          { return "/org-" + o; }
    private static String proj(UUID o, UUID p) { return org(o) + "/proj-" + p; }

    private static Set<Permissao> permissoes(Set<String> grupos, UUID o, UUID p) {
        return MatrizPermissoes.doProjeto(ResolucaoPapeis.papeisNoProjeto(grupos, o, p));
    }

    // Dono de A, membro de B, gestor elevado só no projeto 3 de B
    private Set<String> usuarioMisto() {
        return Set.of(org(orgA) + "/_dono", org(orgB) + "/_membros", proj(orgB, projB3) + "/_gestores");
    }

    @Test
    void donoDaOrganizacao_eDonoEmTodoProjetoDela() {
        assertThat(ResolucaoPapeis.papeisNoProjeto(usuarioMisto(), orgA, projA1)).containsExactly(DONO);
        assertThat(ResolucaoPapeis.papeisNoProjeto(usuarioMisto(), orgA, UUID.randomUUID())).containsExactly(DONO);
        assertThat(permissoes(usuarioMisto(), orgA, projA1)).contains(PROJETO_DELETE, REQ_APPROVE);
        assertThat(ResolucaoPapeis.papelNaOrganizacao(usuarioMisto(), orgA)).contains(PapelOrganizacao.DONO);
    }

    @Test
    void gestorElevado_somaGestorComTecnico_soNaqueleProjeto() {
        assertThat(ResolucaoPapeis.papeisNoProjeto(usuarioMisto(), orgB, projB3))
                .containsExactlyInAnyOrder(GESTOR, STAKEHOLDER_TECNICO);
        assertThat(permissoes(usuarioMisto(), orgB, projB3))
                .contains(REQ_APPROVE, PROJETO_INATIVAR)
                .doesNotContain(PROJETO_DELETE);
    }

    @Test
    void membroDaOrganizacao_eSoTecnicoNosDemaisProjetos_semSolicitarAprovacao() {
        assertThat(ResolucaoPapeis.papeisNoProjeto(usuarioMisto(), orgB, projB4)).containsExactly(STAKEHOLDER_TECNICO);
        assertThat(permissoes(usuarioMisto(), orgB, projB4))
                .contains(REQ_VIEW, REQ_REQUEST_CHANGE)
                .doesNotContain(REQ_APPROVE, REQ_EDIT, REQ_REQUEST_APPROVAL); // D10
        assertThat(ResolucaoPapeis.papelNaOrganizacao(usuarioMisto(), orgB)).contains(PapelOrganizacao.MEMBRO);
    }

    @Test
    void semVinculo_naoTemPapelNemPermissao() {
        assertThat(ResolucaoPapeis.papeisNoProjeto(usuarioMisto(), orgC, projC5)).isEmpty();
        assertThat(permissoes(usuarioMisto(), orgC, projC5)).isEmpty();
        assertThat(ResolucaoPapeis.papelNaOrganizacao(usuarioMisto(), orgC)).isEmpty();
    }

    @Test
    void gestorDaOrganizacao_eGestorEmTodoProjeto_masNaoEditaOrgNemExcluiProjeto() { // D13, D14
        Set<String> grupos = Set.of(org(orgD) + "/_gestores");

        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgD, projD1)).containsExactly(GESTOR);
        assertThat(permissoes(grupos, orgD, projD1)).contains(PROJETO_EDIT, PROJETO_INATIVAR).doesNotContain(PROJETO_DELETE);

        var papelOrg = ResolucaoPapeis.papelNaOrganizacao(grupos, orgD).orElseThrow();
        assertThat(papelOrg).isEqualTo(PapelOrganizacao.GESTOR);
        assertThat(MatrizPermissoes.daOrganizacao(papelOrg))
                .contains(ORG_CREATE_PROJECT, ORG_INATIVAR, ORG_PROMOTE_USER)
                .doesNotContain(ORG_EDIT, ORG_DELETE, ORG_REMOVE_USER);
    }

    @Test
    void stakeholderConvidadoAoProjeto_temTecnicoECliente_soNele() { // D9
        Set<String> grupos = Set.of(
                proj(orgC, projC5) + "/_stakeholders_tecnicos",
                proj(orgC, projC5) + "/_stakeholders_clientes");

        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgC, projC5))
                .containsExactlyInAnyOrder(STAKEHOLDER_TECNICO, STAKEHOLDER_CLIENTE);
        assertThat(permissoes(grupos, orgC, projC5)).contains(REQ_REQUEST_APPROVAL).doesNotContain(REQ_EDIT);
        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgC, projC6)).isEmpty();
        assertThat(ResolucaoPapeis.papelNaOrganizacao(grupos, orgC)).isEmpty();
    }

    @Test
    void gestorDeUmProjeto_naoVazaParaOutroProjetoDaMesmaOrganizacao() {
        Set<String> grupos = Set.of(proj(orgB, projB3) + "/_gestores");

        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgB, projB3)).containsExactly(GESTOR);
        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgB, projB4)).isEmpty();
    }

    @Test
    void donoPelaOrganizacaoEPeloProjeto_naoDuplicaPapel() {
        Set<String> grupos = Set.of(org(orgA) + "/_dono", proj(orgA, projA1) + "/_dono");
        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgA, projA1)).containsExactly(DONO);
    }

    @Test
    void adminDaPlataforma_naoGanhaAcessoAOrganizacoes() {
        Set<String> grupos = Set.of("/_admin");

        assertThat(ResolucaoPapeis.isAdminPlataforma(grupos)).isTrue();
        assertThat(ResolucaoPapeis.papeisNoProjeto(grupos, orgA, projA1)).isEmpty();
        assertThat(ResolucaoPapeis.papelNaOrganizacao(grupos, orgA)).isEmpty();
        assertThat(ResolucaoPapeis.isAdminPlataforma(usuarioMisto())).isFalse();
    }
}
