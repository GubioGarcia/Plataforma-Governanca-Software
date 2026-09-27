package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Ponto único de decisão de acesso (RBAC + multi-tenancy).
 *
 * Lê o JWT da requisição atual no SecurityContext — os services não precisam
 * receber o Jwt por parâmetro. Uso típico, logo após carregar a entidade:
 * <pre>autorizacao.exigir(projeto, Permissao.REQ_EDIT);</pre>
 * Regras que dependem do estado do registro (ex.: requisito APROVADO) continuam
 * nos services, depois desta checagem.
 */
@Service
public class AutorizacaoService {

    // ── Consultas ─────────────────────────────────────────────────────────────

    public Set<PapelProjeto> papeisNoProjeto(Projeto projeto) {
        return ResolucaoPapeis.papeisNoProjeto(grupos(), projeto.getOrganizacao().getId(), projeto.getId());
    }

    public Optional<PapelOrganizacao> papelNaOrganizacao(Organizacao organizacao) {
        return ResolucaoPapeis.papelNaOrganizacao(grupos(), organizacao.getId());
    }

    public Set<Permissao> permissoesNoProjeto(Projeto projeto) {
        return MatrizPermissoes.doProjeto(papeisNoProjeto(projeto));
    }

    public Set<Permissao> permissoesNaOrganizacao(Organizacao organizacao) {
        return MatrizPermissoes.daOrganizacao(papelNaOrganizacao(organizacao).orElse(null));
    }

    public boolean pode(Projeto projeto, Permissao permissao) {
        return permissoesNoProjeto(projeto).contains(permissao);
    }

    public boolean pode(Organizacao organizacao, Permissao permissao) {
        return permissoesNaOrganizacao(organizacao).contains(permissao);
    }

    public boolean isAdminPlataforma() {
        return ResolucaoPapeis.isAdminPlataforma(grupos());
    }

    /** Id do usuário no Keycloak (claim "sub") da requisição atual. */
    public UUID keycloakIdAtual() {
        return UUID.fromString(jwtAtual().getSubject());
    }

    // ── Exigências (lançam AcessoNegadoException → 403) ───────────────────────

    public void exigir(Projeto projeto, Permissao permissao) {
        if (!pode(projeto, permissao)) {
            throw new AcessoNegadoException("Você não tem permissão para esta ação no projeto (" + permissao + ").");
        }
    }

    public void exigir(Organizacao organizacao, Permissao permissao) {
        if (!pode(organizacao, permissao)) {
            throw new AcessoNegadoException("Você não tem permissão para esta ação na organização (" + permissao + ").");
        }
    }

    public void exigirAdminPlataforma() {
        if (!isAdminPlataforma()) {
            throw new AcessoNegadoException("Ação restrita ao administrador da plataforma.");
        }
    }

    // ── Token da requisição ───────────────────────────────────────────────────

    private Set<String> grupos() {
        List<String> grupos = jwtAtual().getClaimAsStringList("groups");
        return grupos == null ? Set.of() : new HashSet<>(grupos);
    }

    private Jwt jwtAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return jwtAuth.getToken();
        }
        throw new AcessoNegadoException("Requisição sem usuário autenticado.");
    }
}
