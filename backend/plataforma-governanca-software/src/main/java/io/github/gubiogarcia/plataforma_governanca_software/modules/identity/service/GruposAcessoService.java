package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.EstruturaGrupos;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Cria no Keycloak a estrutura de grupos de acesso de organizações e projetos
 * (ver EstruturaGrupos) e coloca o criador no subgrupo _dono.
 *
 * Consistência banco × Keycloak: se a criação falhar no meio, o grupo já criado
 * é excluído; se a transação do banco for revertida depois, o grupo também é
 * excluído (compensação no afterCompletion).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GruposAcessoService {

    private final KeycloakAdminClient keycloakAdminClient;

    /** Cria /org-{id} com _dono, _gestores e _membros. Devolve o id do grupo /org-{id}. */
    public UUID criarEstruturaOrganizacao(Organizacao organizacao, Usuario criador) {
        return criarEstrutura(
                "da organização " + organizacao.getId(),
                () -> keycloakAdminClient.criarGrupo(EstruturaGrupos.nomeGrupoOrganizacao(organizacao.getId())),
                EstruturaGrupos.SUBGRUPOS_ORGANIZACAO,
                criador);
    }

    /** Cria /org-{id}/proj-{id} com _dono, _gestores e os dois subgrupos de stakeholder. */
    public UUID criarEstruturaProjeto(Projeto projeto, Usuario criador) {
        UUID grupoOrganizacao = projeto.getOrganizacao().getKeycloakGroupId();
        if (grupoOrganizacao == null) {
            throw new EstruturaGruposException(
                    "A organização " + projeto.getOrganizacao().getId()
                            + " não possui grupo de acesso no Keycloak; não é possível criar o grupo do projeto.");
        }
        return criarEstrutura(
                "do projeto " + projeto.getId(),
                () -> keycloakAdminClient.criarSubgrupo(grupoOrganizacao, EstruturaGrupos.nomeGrupoProjeto(projeto.getId())),
                EstruturaGrupos.SUBGRUPOS_PROJETO,
                criador);
    }

    private UUID criarEstrutura(String descricao, Supplier<UUID> criarGrupoPrincipal,
                                Map<String, String> subgrupos, Usuario criador) {
        UUID grupoId;
        try {
            grupoId = criarGrupoPrincipal.get();
        } catch (RuntimeException ex) {
            throw new EstruturaGruposException("Falha ao criar os grupos de acesso " + descricao + " no Keycloak.", ex);
        }

        UUID criadorKeycloakId = criador != null ? criador.getExternalIdentityId() : null;
        try {
            for (Map.Entry<String, String> subgrupo : subgrupos.entrySet()) {
                UUID subgrupoId = keycloakAdminClient.criarSubgrupo(grupoId, subgrupo.getKey());
                keycloakAdminClient.mapearRoleNoGrupo(subgrupoId, subgrupo.getValue());
                if (EstruturaGrupos.DONO.equals(subgrupo.getKey()) && criadorKeycloakId != null) {
                    keycloakAdminClient.adicionarMembro(criadorKeycloakId, subgrupoId);
                }
            }
        } catch (RuntimeException ex) {
            excluirSemFalhar(grupoId);
            throw new EstruturaGruposException("Falha ao criar os grupos de acesso " + descricao + " no Keycloak.", ex);
        }

        if (criadorKeycloakId == null) {
            log.warn("Grupos de acesso {} criados sem Dono: o criador não tem conta no Keycloak.", descricao);
        }

        excluirSeTransacaoForRevertida(grupoId);
        return grupoId;
    }

    private void excluirSeTransacaoForRevertida(UUID grupoId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    log.warn("Transação revertida; removendo o grupo {} criado no Keycloak.", grupoId);
                    excluirSemFalhar(grupoId);
                }
            }
        });
    }

    private void excluirSemFalhar(UUID grupoId) {
        try {
            keycloakAdminClient.excluirGrupo(grupoId);
        } catch (RuntimeException ex) {
            log.error("Não foi possível remover o grupo {} do Keycloak; remova manualmente. Causa: {}",
                    grupoId, ex.getMessage());
        }
    }

    // Exceções de domínio

    public static class EstruturaGruposException extends RuntimeException {
        public EstruturaGruposException(String message) { super(message); }
        public EstruturaGruposException(String message, Throwable cause) { super(message, cause); }
    }
}
