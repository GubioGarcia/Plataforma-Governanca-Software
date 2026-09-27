package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.MeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto.UsuarioResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelOrganizacao;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Monta o GET /api/auth/me a partir dos grupos do token (mesmas regras do AutorizacaoService). */
@Service
@RequiredArgsConstructor
public class MeService {

    private final UsuarioService usuarioService;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final AutorizacaoService autorizacao;

    @Transactional(readOnly = true)
    public MeResponseDTO montar(Jwt jwt) {
        UsuarioResponseDTO u = usuarioService.resolverUsuario(jwt);

        List<MeResponseDTO.OrganizacaoAcesso> organizacoes = organizacaoRepository
                .findAllById(autorizacao.organizacoesComVinculo()).stream()
                .sorted(Comparator.comparing(Organizacao::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(this::organizacao)
                .toList();

        return new MeResponseDTO(u.id(), u.externalIdentityId(), u.nome(), u.email(), u.ativo(),
                u.dataCriacao(), u.urlMidiaPerfil(), autorizacao.isAdminPlataforma(), organizacoes);
    }

    private MeResponseDTO.OrganizacaoAcesso organizacao(Organizacao org) {
        Optional<PapelOrganizacao> papel = autorizacao.papelNaOrganizacao(org);

        // Papel na organização → todos os projetos dela; convidado → só os projetos em que está
        List<Projeto> projetos = projetoRepository.findAllByOrganizacaoId(org.getId());
        if (papel.isEmpty()) {
            Set<UUID> diretos = autorizacao.projetosComVinculoDireto(org.getId());
            projetos = projetos.stream().filter(p -> diretos.contains(p.getId())).toList();
        }

        return new MeResponseDTO.OrganizacaoAcesso(
                org.getId(), org.getNome(), org.getAtivo(),
                papel.orElse(null),
                autorizacao.permissoesNaOrganizacao(org),
                projetos.stream()
                        .sorted(Comparator.comparing(Projeto::getNome, String.CASE_INSENSITIVE_ORDER))
                        .map(p -> new MeResponseDTO.ProjetoAcesso(
                                p.getId(), p.getNome(), p.getAtivo(),
                                autorizacao.papeisNoProjeto(p),
                                autorizacao.permissoesNoProjeto(p)))
                        .toList());
    }
}
