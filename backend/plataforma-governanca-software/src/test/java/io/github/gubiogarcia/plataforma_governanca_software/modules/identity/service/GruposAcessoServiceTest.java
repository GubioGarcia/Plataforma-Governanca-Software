package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminException;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Teste unitário (sem Spring): o KeycloakAdminClient é simulado e cada subgrupo
 * criado recebe um id previsível, guardado por nome em {@link #subgrupos}.
 */
class GruposAcessoServiceTest {

    private KeycloakAdminClient keycloak;
    private GruposAcessoService service;

    private final UUID grupoOrgId  = UUID.randomUUID();
    private final UUID grupoProjId = UUID.randomUUID();
    private final Map<String, UUID> subgrupos = new HashMap<>();

    private Organizacao organizacao;
    private Usuario criador;

    @BeforeEach
    void setUp() {
        keycloak = mock(KeycloakAdminClient.class);
        service  = new GruposAcessoService(keycloak, mock(RevogacaoTokenService.class));

        organizacao = Organizacao.builder().id(UUID.randomUUID()).build();
        criador     = Usuario.builder().id(UUID.randomUUID()).externalIdentityId(UUID.randomUUID()).build();

        when(keycloak.criarGrupo(anyString())).thenReturn(grupoOrgId);
        when(keycloak.criarSubgrupo(any(), anyString())).thenAnswer(inv -> {
            UUID pai = inv.getArgument(0);
            String nome = inv.getArgument(1);
            if (nome.startsWith("proj-")) return grupoProjId;
            return subgrupos.computeIfAbsent(pai + "/" + nome, k -> UUID.randomUUID());
        });
    }

    @AfterEach
    void limparSincronizacao() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    private UUID sub(UUID pai, String nome) {
        return subgrupos.get(pai + "/" + nome);
    }

    // ─── organização ─────────────────────────────────────────────────────────

    @Test
    void organizacao_deveCriarGrupoComSubgruposERoles_eCriadorNoDono() {
        UUID resultado = service.criarEstruturaOrganizacao(organizacao, criador);

        assertThat(resultado).isEqualTo(grupoOrgId);
        verify(keycloak).criarGrupo("org-" + organizacao.getId());
        verify(keycloak).mapearRoleNoGrupo(sub(grupoOrgId, "_dono"), "ORG_OWNER");
        verify(keycloak).mapearRoleNoGrupo(sub(grupoOrgId, "_gestores"), "ORG_MANAGER");
        verify(keycloak).mapearRoleNoGrupo(sub(grupoOrgId, "_membros"), "ORG_MEMBER");
        verify(keycloak).adicionarMembro(criador.getExternalIdentityId(), sub(grupoOrgId, "_dono"));
        verify(keycloak, times(1)).adicionarMembro(any(), any());
    }

    @Test
    void organizacao_deveCriarSemDono_quandoCriadorNaoTemContaNoKeycloak() {
        Usuario semConta = Usuario.builder().id(UUID.randomUUID()).build();

        UUID resultado = service.criarEstruturaOrganizacao(organizacao, semConta);

        assertThat(resultado).isEqualTo(grupoOrgId);
        verify(keycloak, times(3)).criarSubgrupo(eq(grupoOrgId), anyString());
        verify(keycloak, never()).adicionarMembro(any(), any());
    }

    // ─── projeto ─────────────────────────────────────────────────────────────

    @Test
    void projeto_deveCriarDentroDoGrupoDaOrganizacao_comQuatroSubgrupos() {
        organizacao.setKeycloakGroupId(grupoOrgId);
        Projeto projeto = Projeto.builder().id(UUID.randomUUID()).organizacao(organizacao).build();

        UUID resultado = service.criarEstruturaProjeto(projeto, criador);

        assertThat(resultado).isEqualTo(grupoProjId);
        verify(keycloak).criarSubgrupo(grupoOrgId, "proj-" + projeto.getId());
        verify(keycloak).mapearRoleNoGrupo(sub(grupoProjId, "_dono"), "PROJECT_OWNER");
        verify(keycloak).mapearRoleNoGrupo(sub(grupoProjId, "_gestores"), "PROJECT_MANAGER");
        verify(keycloak).mapearRoleNoGrupo(sub(grupoProjId, "_stakeholders_tecnicos"), "STAKEHOLDER_TECHNICAL");
        verify(keycloak).mapearRoleNoGrupo(sub(grupoProjId, "_stakeholders_clientes"), "STAKEHOLDER_CLIENT");
        verify(keycloak).adicionarMembro(criador.getExternalIdentityId(), sub(grupoProjId, "_dono"));
        verify(keycloak, never()).criarGrupo(anyString());
    }

    @Test
    void projeto_deveFalharSemChamarKeycloak_quandoOrganizacaoNaoTemGrupo() {
        Projeto projeto = Projeto.builder().id(UUID.randomUUID()).organizacao(organizacao).build();

        assertThatThrownBy(() -> service.criarEstruturaProjeto(projeto, criador))
                .isInstanceOf(GruposAcessoService.EstruturaGruposException.class);
        verifyNoInteractions(keycloak);
    }

    // ─── falhas e compensação ────────────────────────────────────────────────

    @Test
    void deveExcluirGrupoCriado_quandoFalhaNoMeioDaEstrutura() {
        doThrow(new KeycloakAdminException("role inexistente", 404))
                .when(keycloak).mapearRoleNoGrupo(any(), eq("ORG_MANAGER"));

        assertThatThrownBy(() -> service.criarEstruturaOrganizacao(organizacao, criador))
                .isInstanceOf(GruposAcessoService.EstruturaGruposException.class);
        verify(keycloak).excluirGrupo(grupoOrgId);
    }

    @Test
    void naoDeveExcluirNada_quandoFalhaAoCriarOGrupoPrincipal() {
        when(keycloak.criarGrupo(anyString())).thenThrow(new KeycloakAdminException("fora do ar", 503));

        assertThatThrownBy(() -> service.criarEstruturaOrganizacao(organizacao, criador))
                .isInstanceOf(GruposAcessoService.EstruturaGruposException.class);
        verify(keycloak, never()).excluirGrupo(any());
    }

    @Test
    void deveExcluirGrupo_quandoTransacaoDoBancoForRevertida() {
        TransactionSynchronizationManager.initSynchronization();

        service.criarEstruturaOrganizacao(organizacao, criador);
        verify(keycloak, never()).excluirGrupo(any());

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        verify(keycloak).excluirGrupo(grupoOrgId);
    }

    @Test
    void naoDeveExcluirGrupo_quandoTransacaoDoBancoForConfirmada() {
        TransactionSynchronizationManager.initSynchronization();

        service.criarEstruturaOrganizacao(organizacao, criador);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));

        verify(keycloak, never()).excluirGrupo(any());
    }
}
