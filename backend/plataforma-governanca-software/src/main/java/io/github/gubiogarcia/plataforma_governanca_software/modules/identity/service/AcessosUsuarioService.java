package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.AcessosUsuarioDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.ResolucaoPapeis;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Onde uma pessoa atua, para a tela de usuários do Admin da Plataforma. Os grupos
 * vêm do Keycloak (não do token, que é de quem está consultando) e passam pela
 * mesma ResolucaoPapeis do AutorizacaoService e do /api/auth/me.
 */
@Service
@RequiredArgsConstructor
public class AcessosUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final KeycloakAdminClient keycloakAdminClient;
    private final AutorizacaoService autorizacao;

    @Transactional(readOnly = true)
    public AcessosUsuarioDTO acessosDe(UUID usuarioId) {
        autorizacao.exigirAdminPlataforma();

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new UsuarioService.UsuarioNaoEncontradoException(
                        "Nenhum usuário encontrado com o id: " + usuarioId));

        Set<String> grupos = keycloakAdminClient.listarGruposDoUsuario(usuario.getExternalIdentityId()).stream()
                .map(KeycloakAdminClient.GrupoDoUsuario::caminho)
                .collect(Collectors.toSet());

        List<AcessosUsuarioDTO.OrganizacaoAcesso> organizacoes = organizacaoRepository
                .findAllById(ResolucaoPapeis.organizacoesComVinculo(grupos)).stream()
                .sorted(Comparator.comparing(Organizacao::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(org -> organizacao(org, grupos))
                .toList();

        return new AcessosUsuarioDTO(usuario.getId(), organizacoes);
    }

    private AcessosUsuarioDTO.OrganizacaoAcesso organizacao(Organizacao org, Set<String> grupos) {
        Optional<PapelOrganizacao> papel = ResolucaoPapeis.papelNaOrganizacao(grupos, org.getId());

        // Papel na organização → todos os projetos dela; convidado → só os projetos em que está
        List<Projeto> projetos = projetoRepository.findAllByOrganizacaoId(org.getId());
        if (papel.isEmpty()) {
            Set<UUID> diretos = ResolucaoPapeis.projetosComVinculoDireto(grupos, org.getId());
            projetos = projetos.stream().filter(p -> diretos.contains(p.getId())).toList();
        }

        return new AcessosUsuarioDTO.OrganizacaoAcesso(
                org.getId(), org.getNome(), org.getAtivo(),
                papel.orElse(null),
                projetos.stream()
                        .sorted(Comparator.comparing(Projeto::getNome, String.CASE_INSENSITIVE_ORDER))
                        .map(p -> new AcessosUsuarioDTO.ProjetoAcesso(
                                p.getId(), p.getNome(), p.getAtivo(),
                                ResolucaoPapeis.papeisNoProjeto(grupos, org.getId(), p.getId())))
                        .toList());
    }
}
