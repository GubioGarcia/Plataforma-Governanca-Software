package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Nomes e caminhos dos grupos de acesso no Keycloak (decisão D1: nomes por UUID).
 *
 * <pre>
 * /_admin                                          Admin da Plataforma
 * /org-{uuid}/_dono | _gestores | _membros         papéis na organização
 * /org-{uuid}/proj-{uuid}/_dono | _gestores
 *                        | _stakeholders_tecnicos | _stakeholders_clientes
 * </pre>
 *
 * O papel vem sempre do subgrupo; as roles mapeadas em cada subgrupo servem de
 * documentação para quem lê o token puro (o backend decide pela matriz estática).
 */
public final class EstruturaGrupos {

    public static final String ADMIN_PLATAFORMA = "/_admin";

    public static final String DONO                  = "_dono";
    public static final String GESTORES              = "_gestores";
    public static final String MEMBROS               = "_membros";
    public static final String STAKEHOLDERS_TECNICOS = "_stakeholders_tecnicos";
    public static final String STAKEHOLDERS_CLIENTES = "_stakeholders_clientes";

    /** Subgrupos criados com toda organização → role de realm mapeada em cada um. */
    public static final Map<String, String> SUBGRUPOS_ORGANIZACAO = ordenado(
            DONO,     "ORG_OWNER",
            GESTORES, "ORG_MANAGER",
            MEMBROS,  "ORG_MEMBER");

    /** Subgrupos criados com todo projeto → role de realm mapeada em cada um. */
    public static final Map<String, String> SUBGRUPOS_PROJETO = ordenado(
            DONO,                  "PROJECT_OWNER",
            GESTORES,              "PROJECT_MANAGER",
            STAKEHOLDERS_TECNICOS, "STAKEHOLDER_TECHNICAL",
            STAKEHOLDERS_CLIENTES, "STAKEHOLDER_CLIENT");

    private EstruturaGrupos() {}

    public static String nomeGrupoOrganizacao(UUID organizacaoId) {
        return "org-" + organizacaoId;
    }

    public static String nomeGrupoProjeto(UUID projetoId) {
        return "proj-" + projetoId;
    }

    public static String caminhoOrganizacao(UUID organizacaoId) {
        return "/" + nomeGrupoOrganizacao(organizacaoId);
    }

    public static String caminhoProjeto(UUID organizacaoId, UUID projetoId) {
        return caminhoOrganizacao(organizacaoId) + "/" + nomeGrupoProjeto(projetoId);
    }

    private static Map<String, String> ordenado(String... paresChaveValor) {
        Map<String, String> mapa = new LinkedHashMap<>();
        for (int i = 0; i < paresChaveValor.length; i += 2) {
            mapa.put(paresChaveValor[i], paresChaveValor[i + 1]);
        }
        return Collections.unmodifiableMap(mapa);
    }
}
