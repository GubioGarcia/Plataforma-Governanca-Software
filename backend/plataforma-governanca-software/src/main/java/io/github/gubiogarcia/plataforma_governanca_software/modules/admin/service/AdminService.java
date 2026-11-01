package io.github.gubiogarcia.plataforma_governanca_software.modules.admin.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto.ResumoAdminDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto.UsuarioAdminDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.EstruturaGrupos;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.repository.SolicitacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.shared.PaginaDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Área administrativa (Admin da Plataforma). Só contagens e dados de conta: o
 * Admin não tem acesso ao conteúdo das organizações e dos projetos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    public static final int TAMANHO_MAXIMO_PAGINA = 100;

    private final AutorizacaoService autorizacao;
    private final KeycloakAdminClient keycloakAdminClient;
    private final UsuarioRepository usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final RequisitoRepository requisitoRepository;
    private final SolicitacaoRepository solicitacaoRepository;

    @Transactional(readOnly = true)
    public ResumoAdminDTO resumo() {
        autorizacao.exigirAdminPlataforma();
        Set<UUID> admins = contasDeAdmin();

        return new ResumoAdminDTO(
                usuarioRepository.count(foraDosAdmins(admins).and(comAtivo(true))),
                usuarioRepository.count(foraDosAdmins(admins).and(comAtivo(false))),
                organizacaoRepository.countByAtivo(true),
                projetoRepository.countByAtivo(true),
                porStatus(requisitoRepository.contarAtivosPorStatus()),
                solicitacaoRepository.countByStatus(StatusSolicitacao.PENDENTE));
    }

    /** Contas da plataforma, paginadas, com busca por nome ou e-mail e filtro por situação. */
    @Transactional(readOnly = true)
    public PaginaDTO<UsuarioAdminDTO> usuarios(int pagina, int tamanho, String busca, Boolean ativo) {
        autorizacao.exigirAdminPlataforma();
        Set<UUID> admins = contasDeAdmin();
        UUID atual = autorizacao.keycloakIdAtual();

        Specification<Usuario> filtro = comBusca(busca).and(comAtivo(ativo));
        var page = usuarioRepository.findAll(filtro, PageRequest.of(
                Math.max(pagina, 0), Math.clamp(tamanho, 1, TAMANHO_MAXIMO_PAGINA), Sort.by("nome").ascending()));

        return PaginaDTO.de(page, u -> new UsuarioAdminDTO(
                u.getId(), u.getNome(), u.getEmail(), u.getAtivo(), u.getDataCriacao(),
                u.getExternalIdentityId() != null && admins.contains(u.getExternalIdentityId()),
                atual.equals(u.getExternalIdentityId())));
    }

    /** Ids no Keycloak dos membros de /_admin. Sem o Keycloak, segue sem marcar ninguém. */
    private Set<UUID> contasDeAdmin() {
        try {
            return keycloakAdminClient.buscarGrupoPorCaminho(EstruturaGrupos.ADMIN_PLATAFORMA)
                    .map(keycloakAdminClient::listarMembros)
                    .<Set<UUID>>map(Set::copyOf)
                    .orElse(Set.of());
        } catch (RuntimeException ex) { // KeycloakAdminException ou falha de conexão
            log.warn("Não foi possível listar os membros de {}: {}", EstruturaGrupos.ADMIN_PLATAFORMA, ex.getMessage());
            return Set.of();
        }
    }

    // ── Filtros ───────────────────────────────────────────────────────────────

    private static Specification<Usuario> comAtivo(Boolean ativo) {
        return (root, query, cb) -> ativo == null ? null : cb.equal(root.get("ativo"), ativo);
    }

    private static Specification<Usuario> comBusca(String busca) {
        return (root, query, cb) -> {
            if (busca == null || busca.isBlank()) return null;
            String termo = "%" + busca.trim().toLowerCase() + "%";
            return cb.or(cb.like(cb.lower(root.get("nome")), termo), cb.like(cb.lower(root.get("email")), termo));
        };
    }

    private static Specification<Usuario> foraDosAdmins(Set<UUID> admins) {
        return (root, query, cb) -> {
            if (admins.isEmpty()) return null;
            var id = root.<UUID>get("externalIdentityId");
            return cb.or(cb.isNull(id), cb.not(id.in(admins)));
        };
    }

    /** Linhas (nome do status, quantidade) → mapa na ordem da consulta. */
    private static Map<String, Long> porStatus(List<Object[]> linhas) {
        return linhas.stream().collect(Collectors.toMap(l -> (String) l[0], l -> (Long) l[1], Long::sum, LinkedHashMap::new));
    }
}
