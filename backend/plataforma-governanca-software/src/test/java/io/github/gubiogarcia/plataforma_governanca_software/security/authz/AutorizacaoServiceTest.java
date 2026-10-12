package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/** AutorizacaoService lendo o token do SecurityContext (sem Spring: só o contexto de segurança). */
class AutorizacaoServiceTest {

    private final AutorizacaoService service = new AutorizacaoService();

    private final Organizacao organizacao = Organizacao.builder().id(UUID.randomUUID()).build();
    private final Projeto projeto = Projeto.builder().id(UUID.randomUUID()).organizacao(organizacao).build();

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    /** Coloca no SecurityContext um token com os grupos informados (null = sem claim groups). */
    static UUID autenticar(List<String> grupos) {
        UUID sub = UUID.randomUUID();
        Jwt.Builder jwt = Jwt.withTokenValue("t").header("alg", "none").subject(sub.toString());
        if (grupos != null) jwt.claim("groups", grupos);
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt.build()));
        return sub;
    }

    @Test
    void exigir_passa_quandoPapelTemAPermissao() {
        autenticar(List.of("/org-" + organizacao.getId() + "/proj-" + projeto.getId() + "/_gestores"));

        assertThatCode(() -> service.exigir(projeto, Permissao.REQ_APPROVE)).doesNotThrowAnyException();
        assertThat(service.pode(projeto, Permissao.PROJETO_DELETE)).isFalse();
    }

    @Test
    void exigir_lanca403_quandoPapelNaoTemAPermissao() {
        autenticar(List.of("/org-" + organizacao.getId() + "/_membros"));

        assertThatThrownBy(() -> service.exigir(projeto, Permissao.REQ_EDIT))
                .isInstanceOf(AcessoNegadoException.class)
                .hasMessageContaining("REQ_EDIT");
        assertThatThrownBy(() -> service.exigir(organizacao, Permissao.ORG_EDIT))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void exigirNaOrganizacao_respeitaODono() {
        autenticar(List.of("/org-" + organizacao.getId() + "/_dono"));

        assertThatCode(() -> service.exigir(organizacao, Permissao.ORG_EDIT)).doesNotThrowAnyException();
        assertThat(service.papelNaOrganizacao(organizacao)).contains(PapelOrganizacao.DONO);
    }

    @Test
    void tokenSemClaimGroups_naoTemAcesso() {
        autenticar(null);

        assertThat(service.permissoesNoProjeto(projeto)).isEmpty();
        assertThat(service.isAdminPlataforma()).isFalse();
    }

    @Test
    void adminPlataforma_eKeycloakIdAtual() {
        UUID sub = autenticar(List.of("/_admin"));

        assertThatCode(service::exigirAdminPlataforma).doesNotThrowAnyException();
        assertThat(service.keycloakIdAtual()).isEqualTo(sub);
    }

    @Test
    void semAutenticacao_negaAcesso() {
        assertThatThrownBy(() -> service.exigir(projeto, Permissao.REQ_VIEW)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(service::exigirAdminPlataforma).isInstanceOf(AcessoNegadoException.class);
    }
}
