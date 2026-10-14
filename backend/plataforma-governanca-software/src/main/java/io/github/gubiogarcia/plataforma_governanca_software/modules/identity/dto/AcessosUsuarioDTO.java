package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * GET /api/usuario/{id}/acessos — onde uma pessoa atua (tela de usuários do Admin
 * da Plataforma). Mesma resolução de papéis do /api/auth/me, a partir dos grupos
 * dela no Keycloak.
 */
public record AcessosUsuarioDTO(UUID usuarioId, List<OrganizacaoAcesso> organizacoes) {

    /** papel = null quando a pessoa só participa de projetos da organização (convidada). */
    public record OrganizacaoAcesso(
            UUID id,
            String nome,
            Boolean ativo,
            PapelOrganizacao papel,
            List<ProjetoAcesso> projetos
    ) {}

    public record ProjetoAcesso(
            UUID id,
            String nome,
            Boolean ativo,
            Set<PapelProjeto> papeis
    ) {}
}
