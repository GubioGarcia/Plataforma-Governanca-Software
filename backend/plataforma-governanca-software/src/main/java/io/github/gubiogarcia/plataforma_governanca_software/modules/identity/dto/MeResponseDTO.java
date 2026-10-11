package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * GET /api/auth/me — usuário + onde ele atua e o que pode fazer em cada lugar.
 * O front decide o que mostrar a partir daqui; o backend continua checando tudo.
 */
public record MeResponseDTO(
        UUID id,
        UUID externalIdentityId,
        String nome,
        String email,
        Boolean ativo,
        Instant dataCriacao,
        String urlMidiaPerfil,
        boolean adminPlataforma,
        List<OrganizacaoAcesso> organizacoes
) {

    /** papel = null quando o usuário só participa de projetos da organização (convidado). */
    public record OrganizacaoAcesso(
            UUID id,
            String nome,
            Boolean ativo,
            PapelOrganizacao papel,
            Set<Permissao> permissoes,
            List<ProjetoAcesso> projetos
    ) {}

    public record ProjetoAcesso(
            UUID id,
            String nome,
            Boolean ativo,
            Set<PapelProjeto> papeis,
            Set<Permissao> permissoes
    ) {}
}
