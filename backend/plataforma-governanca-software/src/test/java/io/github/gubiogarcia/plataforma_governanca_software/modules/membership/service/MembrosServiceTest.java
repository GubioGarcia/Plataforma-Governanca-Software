package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient.GrupoDoUsuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.RevogacaoTokenService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Membros (Fase 6) — Keycloak simulado; grupos do alvo e ids dos grupos em memória.
 * Quem age (dono/gestor/membro) é o token montado por AutenticacaoTeste.
 */
class MembrosServiceTest {

    private KeycloakAdminClient keycloak;
    private UsuarioRepository usuarios;
    private RevogacaoTokenService revogacao;
    private MembrosService service;

    private final Organizacao org = Organizacao.builder().id(UUID.randomUUID()).nome("Org").build();
    private final Projeto proj = Projeto.builder().id(UUID.randomUUID()).nome("Proj").organizacao(org).build();
    private final Usuario alvo = Usuario.builder().id(UUID.randomUUID()).externalIdentityId(UUID.randomUUID())
            .nome("Alvo").email("alvo@x.com").build();

    /** caminho → id do grupo, e grupos atuais do alvo. */
    private final Map<String, UUID> grupos = new HashMap<>();
    private final Set<String> gruposDoAlvo = new HashSet<>();

    private String org(String sub)  { return "/org-" + org.getId() + "/" + sub; }
    private String proj(String sub) { return "/org-" + org.getId() + "/proj-" + proj.getId() + "/" + sub; }
    private UUID id(String caminho) { return grupos.computeIfAbsent(caminho, c -> UUID.randomUUID()); }

    @BeforeEach
    void setUp() {
        keycloak = mock(KeycloakAdminClient.class);
        usuarios = mock(UsuarioRepository.class);
        revogacao = mock(RevogacaoTokenService.class);
        OrganizacaoRepository orgs = mock(OrganizacaoRepository.class);
        ProjetoRepository projs = mock(ProjetoRepository.class);
        service = new MembrosService(keycloak, usuarios, orgs, projs, new AutorizacaoService(), revogacao);

        when(orgs.findById(org.getId())).thenReturn(Optional.of(org));
        when(projs.findById(proj.getId())).thenReturn(Optional.of(proj));
        when(usuarios.findById(alvo.getId())).thenReturn(Optional.of(alvo));
        when(keycloak.buscarGrupoPorCaminho(anyString())).thenAnswer(inv -> Optional.of(id(inv.getArgument(0))));
        when(keycloak.listarGruposDoUsuario(alvo.getExternalIdentityId())).thenAnswer(inv ->
                gruposDoAlvo.stream().map(c -> new GrupoDoUsuario(id(c), c)).toList());
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void comoDonoDaOrg()   { AutenticacaoTeste.comGrupos(UUID.randomUUID(), org("_dono")); }
    private void comoGestorDaOrg() { AutenticacaoTeste.comGrupos(UUID.randomUUID(), org("_gestores")); }
    private void comoMembroDaOrg() { AutenticacaoTeste.comGrupos(UUID.randomUUID(), org("_membros")); }

    // ── Organização ───────────────────────────────────────────────────────────

    @Test
    void promoverNaOrganizacao_moveDeMembrosParaGestores_eRevoga() {
        comoGestorDaOrg();
        gruposDoAlvo.add(org("_membros"));

        service.promoverNaOrganizacao(org.getId(), alvo.getId());

        verify(keycloak).adicionarMembro(alvo.getExternalIdentityId(), id(org("_gestores")));
        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(org("_membros")));
        verify(revogacao).revogarTokensDoUsuario(alvo);
    }

    @Test
    void promoverNaOrganizacao_jaGestorOuForaDaOrg_eRecusado() {
        comoDonoDaOrg();
        gruposDoAlvo.add(org("_gestores"));
        assertThatThrownBy(() -> service.promoverNaOrganizacao(org.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.PapelJaAtribuidoException.class);

        gruposDoAlvo.clear();
        assertThatThrownBy(() -> service.promoverNaOrganizacao(org.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.UsuarioNaoParticipaException.class);
    }

    @Test
    void promoverNaOrganizacao_membroNaoPode() {
        comoMembroDaOrg();
        assertThatThrownBy(() -> service.promoverNaOrganizacao(org.getId(), alvo.getId()))
                .isInstanceOf(AcessoNegadoException.class);
        verifyNoInteractions(revogacao);
    }

    @Test
    void removerDaOrganizacao_tiraDeTodosOsGruposDaOrg_inclusiveDonoDeProjeto() { // D16
        comoDonoDaOrg();
        gruposDoAlvo.addAll(List.of(org("_membros"), proj("_dono"), "/org-" + UUID.randomUUID() + "/_membros"));

        service.removerDaOrganizacao(org.getId(), alvo.getId());

        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(org("_membros")));
        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(proj("_dono")));
        verify(keycloak, times(2)).removerMembro(any(), any());   // grupo de outra organização fica
        verify(revogacao).revogarTokensDoUsuario(alvo);
    }

    @Test
    void removerDaOrganizacao_soDono_eDonoNaoERemovivel() { // D3, D6
        comoGestorDaOrg();
        gruposDoAlvo.add(org("_membros"));
        assertThatThrownBy(() -> service.removerDaOrganizacao(org.getId(), alvo.getId()))
                .isInstanceOf(AcessoNegadoException.class);

        comoDonoDaOrg();
        gruposDoAlvo.clear();
        gruposDoAlvo.add(org("_dono"));
        assertThatThrownBy(() -> service.removerDaOrganizacao(org.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.OperacaoNaoPermitidaException.class);
        verify(keycloak, never()).removerMembro(any(), any());
    }

    // ── Projeto ───────────────────────────────────────────────────────────────

    @Test
    void listarDoProjeto_juntaHerdadosEDiretos() {
        comoDonoDaOrg();
        Usuario membro = Usuario.builder().id(UUID.randomUUID()).externalIdentityId(UUID.randomUUID()).nome("Membro").email("m@x.com").build();
        when(keycloak.listarMembros(any())).thenReturn(List.of());
        when(keycloak.listarMembros(id(org("_membros")))).thenReturn(List.of(membro.getExternalIdentityId()));
        when(keycloak.listarMembros(id(proj("_stakeholders_tecnicos")))).thenReturn(List.of(alvo.getExternalIdentityId()));
        when(keycloak.listarMembros(id(proj("_stakeholders_clientes")))).thenReturn(List.of(alvo.getExternalIdentityId()));
        when(usuarios.findAllByExternalIdentityIdIn(any())).thenReturn(List.of(membro, alvo));

        var participantes = service.listarDoProjeto(proj.getId());

        assertThat(participantes).hasSize(2);
        var doAlvo = participantes.stream().filter(p -> p.usuarioId().equals(alvo.getId())).findFirst().orElseThrow();
        assertThat(doAlvo.vinculos()).extracting(v -> v.papel() + "/" + v.origem())
                .containsExactlyInAnyOrder("STAKEHOLDER_TECNICO/PROJETO", "STAKEHOLDER_CLIENTE/PROJETO");
        var doMembro = participantes.stream().filter(p -> p.usuarioId().equals(membro.getId())).findFirst().orElseThrow();
        assertThat(doMembro.vinculos()).extracting(v -> v.papel() + "/" + v.origem())
                .containsExactly("STAKEHOLDER_TECNICO/ORGANIZACAO");
    }

    @Test
    void promoverNoProjeto_addGestores_eTiraDosSubgruposDeStakeholder() {
        comoDonoDaOrg();
        gruposDoAlvo.addAll(List.of(proj("_stakeholders_tecnicos"), proj("_stakeholders_clientes")));

        service.promoverNoProjeto(proj.getId(), alvo.getId());

        verify(keycloak).adicionarMembro(alvo.getExternalIdentityId(), id(proj("_gestores")));
        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(proj("_stakeholders_tecnicos")));
        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(proj("_stakeholders_clientes")));
        verify(revogacao).revogarTokensDoUsuario(alvo);
    }

    @Test
    void promoverNoProjeto_quemNaoParticipaOuJaEGestor_eRecusado() {
        comoDonoDaOrg();
        assertThatThrownBy(() -> service.promoverNoProjeto(proj.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.UsuarioNaoParticipaException.class);

        gruposDoAlvo.add(org("_gestores"));   // Gestor da org já é Gestor em todo projeto (D13)
        assertThatThrownBy(() -> service.promoverNoProjeto(proj.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.PapelJaAtribuidoException.class);
    }

    @Test
    void removerDoProjeto_papelHerdadoOuDono_naoERemovivel() {
        comoDonoDaOrg();
        gruposDoAlvo.add(org("_membros"));
        assertThatThrownBy(() -> service.removerDoProjeto(proj.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.OperacaoNaoPermitidaException.class)
                .hasMessageContaining("herdado");

        gruposDoAlvo.clear();
        gruposDoAlvo.add(proj("_dono"));
        assertThatThrownBy(() -> service.removerDoProjeto(proj.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.OperacaoNaoPermitidaException.class);

        gruposDoAlvo.clear();
        assertThatThrownBy(() -> service.removerDoProjeto(proj.getId(), alvo.getId()))
                .isInstanceOf(MembrosService.UsuarioNaoParticipaException.class);
        verify(keycloak, never()).removerMembro(any(), any());
    }

    @Test
    void removerDoProjeto_tiraSoOsVinculosDiretos() {
        comoDonoDaOrg();
        gruposDoAlvo.addAll(List.of(proj("_gestores"), org("_membros")));

        service.removerDoProjeto(proj.getId(), alvo.getId());

        verify(keycloak).removerMembro(alvo.getExternalIdentityId(), id(proj("_gestores")));
        verify(keycloak, times(1)).removerMembro(any(), any());
        verify(revogacao).revogarTokensDoUsuario(alvo);
    }
}
