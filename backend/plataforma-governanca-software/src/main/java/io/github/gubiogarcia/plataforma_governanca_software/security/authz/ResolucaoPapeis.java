package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.EstruturaGrupos.*;

/**
 * Resolve papéis a partir dos grupos do token (claim "groups", caminho completo).
 *
 * Regra importante (bug documentado no doc de autorização): o papel vem SÓ do
 * subgrupo específico daquela organização/projeto — nunca de realm_access.roles,
 * que é uma lista plana e vazaria permissão de um projeto para outro.
 */
public final class ResolucaoPapeis {

    private ResolucaoPapeis() {}

    public static Optional<PapelOrganizacao> papelNaOrganizacao(Set<String> grupos, UUID organizacaoId) {
        String org = caminhoOrganizacao(organizacaoId);
        if (grupos.contains(org + "/" + DONO))     return Optional.of(PapelOrganizacao.DONO);
        if (grupos.contains(org + "/" + GESTORES)) return Optional.of(PapelOrganizacao.GESTOR);
        if (grupos.contains(org + "/" + MEMBROS))  return Optional.of(PapelOrganizacao.MEMBRO);
        return Optional.empty();
    }

    /**
     * Todos os papéis do usuário no projeto (a permissão efetiva é a união):
     * Dono/Gestor/Membro da organização herdam Dono/Gestor/Stakeholder Técnico em todo
     * projeto dela (D10, D13); subgrupos do projeto acrescentam papéis só ali.
     */
    public static Set<PapelProjeto> papeisNoProjeto(Set<String> grupos, UUID organizacaoId, UUID projetoId) {
        String org  = caminhoOrganizacao(organizacaoId);
        String proj = caminhoProjeto(organizacaoId, projetoId);
        Set<PapelProjeto> papeis = EnumSet.noneOf(PapelProjeto.class);

        if (grupos.contains(org + "/" + DONO) || grupos.contains(proj + "/" + DONO)) {
            papeis.add(PapelProjeto.DONO);
        }
        if (grupos.contains(org + "/" + GESTORES) || grupos.contains(proj + "/" + GESTORES)) {
            papeis.add(PapelProjeto.GESTOR);
        }
        if (grupos.contains(org + "/" + MEMBROS) || grupos.contains(proj + "/" + STAKEHOLDERS_TECNICOS)) {
            papeis.add(PapelProjeto.STAKEHOLDER_TECNICO);
        }
        if (grupos.contains(proj + "/" + STAKEHOLDERS_CLIENTES)) {
            papeis.add(PapelProjeto.STAKEHOLDER_CLIENTE);
        }
        return papeis;
    }

    public static boolean isAdminPlataforma(Set<String> grupos) {
        return grupos.contains(ADMIN_PLATAFORMA);
    }
}
