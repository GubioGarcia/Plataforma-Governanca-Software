package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao.*;

/**
 * Matriz estática papel → permissões (doc de autorização, "Matriz RBAC").
 *
 * É a única fonte usada pelo backend para decidir acesso. As composites do
 * realm-export.json espelham esta matriz só como documentação — um teste
 * (MatrizPermissoesTest) garante que as duas continuem iguais.
 */
public final class MatrizPermissoes {

    private static final Set<Permissao> GESTOR_PROJETO = EnumSet.of(
            REQ_CREATE, REQ_EDIT, REQ_DELETE, REQ_APPROVE, REQ_VIEW, REQ_COMMENT,
            WIKI_VIEW, WIKI_EDIT, WIKI_COMMENT, AUDIT_VIEW, AUDIT_HISTORICO_VIEW,
            PROJETO_EDIT, PROJETO_INATIVAR, PROJETO_VIEW_USERS, PROJETO_INVITE_USER,
            PROJETO_PROMOTE_USER, PROJETO_REMOVE_USER,
            EVENTO_VIEW, EVENTO_CREATE, EVENTO_EDIT, EVENTO_DELETE, EVENTO_APPROVE,
            ARQUIVO_VIEW, ARQUIVO_DOWNLOAD, ARQUIVO_UPLOAD, ARQUIVO_DELETE,
            ANALYTICS_VIEW, MER_VIEW, MER_EDIT, MER_EXPORT,
            RASTREABILIDADE_VIEW, RASTREABILIDADE_EDIT, RASTREABILIDADE_EXPORT,
            SOLICITACAO_RESPONDER);

    private static final Set<Permissao> STAKEHOLDER_TECNICO = EnumSet.of(
            REQ_VIEW, REQ_COMMENT, REQ_REQUEST_CHANGE, REQ_REQUEST_REJECTION,
            WIKI_VIEW, WIKI_COMMENT, AUDIT_HISTORICO_VIEW,
            PROJETO_VIEW_USERS, EVENTO_VIEW, EVENTO_REQUEST, ARQUIVO_VIEW, ARQUIVO_DOWNLOAD,
            ANALYTICS_VIEW, MER_VIEW, MER_EXPORT_REQUEST,
            RASTREABILIDADE_VIEW, RASTREABILIDADE_EXPORT_REQUEST);

    private static final Map<PapelProjeto, Set<Permissao>> POR_PAPEL_PROJETO = new EnumMap<>(PapelProjeto.class);
    private static final Map<PapelOrganizacao, Set<Permissao>> POR_PAPEL_ORGANIZACAO = new EnumMap<>(PapelOrganizacao.class);

    static {
        POR_PAPEL_PROJETO.put(PapelProjeto.DONO,                uniao(GESTOR_PROJETO, EnumSet.of(PROJETO_DELETE)));
        POR_PAPEL_PROJETO.put(PapelProjeto.GESTOR,              GESTOR_PROJETO);
        POR_PAPEL_PROJETO.put(PapelProjeto.STAKEHOLDER_TECNICO, STAKEHOLDER_TECNICO);
        POR_PAPEL_PROJETO.put(PapelProjeto.STAKEHOLDER_CLIENTE, uniao(STAKEHOLDER_TECNICO, EnumSet.of(REQ_REQUEST_APPROVAL)));

        POR_PAPEL_ORGANIZACAO.put(PapelOrganizacao.DONO, EnumSet.of(
                ORG_CREATE_PROJECT, ORG_EDIT, ORG_INATIVAR, ORG_DELETE,
                ORG_INVITE_USER, ORG_VIEW_USERS, ORG_PROMOTE_USER, ORG_REMOVE_USER));
        POR_PAPEL_ORGANIZACAO.put(PapelOrganizacao.GESTOR, EnumSet.of(
                ORG_CREATE_PROJECT, ORG_INATIVAR, ORG_INVITE_USER, ORG_VIEW_USERS, ORG_PROMOTE_USER));
        POR_PAPEL_ORGANIZACAO.put(PapelOrganizacao.MEMBRO, EnumSet.of(ORG_VIEW_USERS));
    }

    /** Permissões exclusivas do Admin da Plataforma (grupo /_admin). */
    public static final Set<Permissao> ADMIN_PLATAFORMA = Collections.unmodifiableSet(EnumSet.of(REF_DATA_EDIT));

    private MatrizPermissoes() {}

    /** União das permissões de todos os papéis do usuário no projeto. */
    public static Set<Permissao> doProjeto(Collection<PapelProjeto> papeis) {
        Set<Permissao> resultado = EnumSet.noneOf(Permissao.class);
        papeis.forEach(p -> resultado.addAll(POR_PAPEL_PROJETO.get(p)));
        return resultado;
    }

    public static Set<Permissao> daOrganizacao(PapelOrganizacao papel) {
        return papel == null ? EnumSet.noneOf(Permissao.class) : EnumSet.copyOf(POR_PAPEL_ORGANIZACAO.get(papel));
    }

    private static Set<Permissao> uniao(Set<Permissao> a, Set<Permissao> b) {
        Set<Permissao> r = EnumSet.copyOf(a);
        r.addAll(b);
        return Collections.unmodifiableSet(r);
    }
}
