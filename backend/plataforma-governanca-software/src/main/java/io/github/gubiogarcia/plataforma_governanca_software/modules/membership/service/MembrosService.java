package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.RevogacaoTokenService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ParticipanteDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.PapelProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.ResolucaoPapeis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.EstruturaGrupos.*;

/**
 * Participantes de organizações e projetos (Fase 6): listar, elevar a Gestor e remover.
 * O pertencimento vive nos grupos do Keycloak; toda mudança revoga os tokens do
 * afetado (a próxima requisição dele renova a sessão com os grupos novos).
 *
 * Regras (doc de autorização): o Dono da organização é único e não é removível (D3);
 * o _dono do projeto e os papéis herdados da organização não são removíveis por
 * projeto; remover da organização tira de todos os subgrupos dela, inclusive do
 * _dono dos projetos que o usuário criou (D16).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MembrosService {

    private static final String ORIGEM_ORGANIZACAO = "ORGANIZACAO";
    private static final String ORIGEM_PROJETO = "PROJETO";

    private final KeycloakAdminClient keycloak;
    private final UsuarioRepository usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final AutorizacaoService autorizacao;
    private final RevogacaoTokenService revogacaoTokenService;

    // ── Organização ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ParticipanteDTO> listarDaOrganizacao(UUID organizacaoId) {
        Organizacao org = carregarOrganizacao(organizacaoId);
        autorizacao.exigir(org, Permissao.ORG_VIEW_USERS);

        Map<UUID, List<ParticipanteDTO.Vinculo>> vinculos = new LinkedHashMap<>();
        String base = caminhoOrganizacao(org.getId());
        Map<String, String> papelPorSubgrupo = Map.of(DONO, "DONO", GESTORES, "GESTOR", MEMBROS, "MEMBRO");
        for (String sub : List.of(DONO, GESTORES, MEMBROS)) {
            for (UUID kcId : membros(base + "/" + sub)) {
                vinculos.computeIfAbsent(kcId, k -> new ArrayList<>())
                        .add(new ParticipanteDTO.Vinculo(papelPorSubgrupo.get(sub), ORIGEM_ORGANIZACAO));
            }
        }
        return montarParticipantes(vinculos);
    }

    /** Eleva um Membro a Gestor da organização (D5). */
    @Transactional
    public void promoverNaOrganizacao(UUID organizacaoId, UUID usuarioId) {
        Organizacao org = carregarOrganizacao(organizacaoId);
        autorizacao.exigir(org, Permissao.ORG_PROMOTE_USER);
        Usuario alvo = carregarUsuario(usuarioId);

        Set<String> grupos = caminhosDoUsuario(alvo);
        String base = caminhoOrganizacao(org.getId());
        if (grupos.contains(base + "/" + DONO) || grupos.contains(base + "/" + GESTORES)) {
            throw new PapelJaAtribuidoException("O usuário já é Dono ou Gestor desta organização.");
        }
        if (!grupos.contains(base + "/" + MEMBROS)) {
            throw new UsuarioNaoParticipaException("O usuário não é Membro desta organização.");
        }

        keycloak.adicionarMembro(alvo.getExternalIdentityId(), grupo(base + "/" + GESTORES));
        keycloak.removerMembro(alvo.getExternalIdentityId(), grupo(base + "/" + MEMBROS));
        revogacaoTokenService.revogarTokensDoUsuario(alvo);
        log.info("Usuário {} elevado a Gestor da organização {}.", usuarioId, organizacaoId);
    }

    /** Remove o usuário da organização e de todos os projetos dela (só o Dono — ORG_REMOVE_USER). */
    @Transactional
    public void removerDaOrganizacao(UUID organizacaoId, UUID usuarioId) {
        Organizacao org = carregarOrganizacao(organizacaoId);
        autorizacao.exigir(org, Permissao.ORG_REMOVE_USER);
        Usuario alvo = carregarUsuario(usuarioId);

        String base = caminhoOrganizacao(org.getId());
        List<KeycloakAdminClient.GrupoDoUsuario> daOrganizacao = keycloak.listarGruposDoUsuario(alvo.getExternalIdentityId())
                .stream().filter(g -> g.caminho().startsWith(base + "/")).toList();

        if (daOrganizacao.isEmpty()) {
            throw new UsuarioNaoParticipaException("O usuário não participa desta organização.");
        }
        if (daOrganizacao.stream().anyMatch(g -> g.caminho().equals(base + "/" + DONO))) {
            throw new OperacaoNaoPermitidaException("O Dono da organização não pode ser removido.");
        }

        daOrganizacao.forEach(g -> keycloak.removerMembro(alvo.getExternalIdentityId(), g.id()));
        revogacaoTokenService.revogarTokensDoUsuario(alvo);
        log.info("Usuário {} removido da organização {} ({} grupo(s)).", usuarioId, organizacaoId, daOrganizacao.size());
    }

    // ── Projeto ───────────────────────────────────────────────────────────────

    /** Participantes do projeto: herdados da organização (Dono, Gestor, Membro) + diretos do projeto. */
    @Transactional(readOnly = true)
    public List<ParticipanteDTO> listarDoProjeto(UUID projetoId) {
        Projeto projeto = carregarProjeto(projetoId);
        autorizacao.exigir(projeto, Permissao.PROJETO_VIEW_USERS);

        String org = caminhoOrganizacao(projeto.getOrganizacao().getId());
        String proj = caminhoProjeto(projeto.getOrganizacao().getId(), projeto.getId());

        Map<UUID, List<ParticipanteDTO.Vinculo>> vinculos = new LinkedHashMap<>();
        adicionarVinculos(vinculos, org + "/" + DONO, PapelProjeto.DONO, ORIGEM_ORGANIZACAO);
        adicionarVinculos(vinculos, proj + "/" + DONO, PapelProjeto.DONO, ORIGEM_PROJETO);
        adicionarVinculos(vinculos, org + "/" + GESTORES, PapelProjeto.GESTOR, ORIGEM_ORGANIZACAO);
        adicionarVinculos(vinculos, proj + "/" + GESTORES, PapelProjeto.GESTOR, ORIGEM_PROJETO);
        adicionarVinculos(vinculos, org + "/" + MEMBROS, PapelProjeto.STAKEHOLDER_TECNICO, ORIGEM_ORGANIZACAO);
        adicionarVinculos(vinculos, proj + "/" + STAKEHOLDERS_TECNICOS, PapelProjeto.STAKEHOLDER_TECNICO, ORIGEM_PROJETO);
        adicionarVinculos(vinculos, proj + "/" + STAKEHOLDERS_CLIENTES, PapelProjeto.STAKEHOLDER_CLIENTE, ORIGEM_PROJETO);
        return montarParticipantes(vinculos);
    }

    /** Eleva um participante a Gestor do projeto (D5, D15). */
    @Transactional
    public void promoverNoProjeto(UUID projetoId, UUID usuarioId) {
        Projeto projeto = carregarProjeto(projetoId);
        autorizacao.exigir(projeto, Permissao.PROJETO_PROMOTE_USER);
        Usuario alvo = carregarUsuario(usuarioId);

        Set<PapelProjeto> papeis = ResolucaoPapeis.papeisNoProjeto(
                caminhosDoUsuario(alvo), projeto.getOrganizacao().getId(), projeto.getId());
        if (papeis.isEmpty()) {
            throw new UsuarioNaoParticipaException("O usuário não participa deste projeto.");
        }
        if (papeis.contains(PapelProjeto.DONO) || papeis.contains(PapelProjeto.GESTOR)) {
            throw new PapelJaAtribuidoException("O usuário já é Dono ou Gestor deste projeto.");
        }

        String proj = caminhoProjeto(projeto.getOrganizacao().getId(), projeto.getId());
        keycloak.adicionarMembro(alvo.getExternalIdentityId(), grupo(proj + "/" + GESTORES));
        // Gestor já cobre as permissões de stakeholder: sai dos subgrupos de stakeholder do projeto
        for (String sub : List.of(STAKEHOLDERS_TECNICOS, STAKEHOLDERS_CLIENTES)) {
            keycloak.buscarGrupoPorCaminho(proj + "/" + sub)
                    .ifPresent(g -> keycloak.removerMembro(alvo.getExternalIdentityId(), g));
        }
        revogacaoTokenService.revogarTokensDoUsuario(alvo);
        log.info("Usuário {} elevado a Gestor do projeto {}.", usuarioId, projetoId);
    }

    /** Remove os vínculos diretos do usuário com o projeto (Gestor/Stakeholder do projeto). */
    @Transactional
    public void removerDoProjeto(UUID projetoId, UUID usuarioId) {
        Projeto projeto = carregarProjeto(projetoId);
        autorizacao.exigir(projeto, Permissao.PROJETO_REMOVE_USER);
        Usuario alvo = carregarUsuario(usuarioId);

        String proj = caminhoProjeto(projeto.getOrganizacao().getId(), projeto.getId());
        List<KeycloakAdminClient.GrupoDoUsuario> grupos = keycloak.listarGruposDoUsuario(alvo.getExternalIdentityId());
        List<KeycloakAdminClient.GrupoDoUsuario> diretos = grupos.stream()
                .filter(g -> g.caminho().startsWith(proj + "/")).toList();

        if (diretos.stream().anyMatch(g -> g.caminho().equals(proj + "/" + DONO))) {
            throw new OperacaoNaoPermitidaException("O Dono do projeto não pode ser removido.");
        }
        if (diretos.isEmpty()) {
            boolean herdado = !ResolucaoPapeis.papeisNoProjeto(
                    grupos.stream().map(KeycloakAdminClient.GrupoDoUsuario::caminho).collect(Collectors.toSet()),
                    projeto.getOrganizacao().getId(), projeto.getId()).isEmpty();
            throw herdado
                    ? new OperacaoNaoPermitidaException(
                            "O papel deste usuário no projeto é herdado da organização; altere o papel dele na organização.")
                    : new UsuarioNaoParticipaException("O usuário não participa deste projeto.");
        }

        diretos.forEach(g -> keycloak.removerMembro(alvo.getExternalIdentityId(), g.id()));
        revogacaoTokenService.revogarTokensDoUsuario(alvo);
        log.info("Usuário {} removido do projeto {}.", usuarioId, projetoId);
    }

    // ── Operações usadas pelos convites ───────────────────────────────────────

    /** Caminhos (grupos) do usuário no Keycloak. */
    public Set<String> caminhosDoUsuario(Usuario usuario) {
        if (usuario.getExternalIdentityId() == null) return Set.of();
        return keycloak.listarGruposDoUsuario(usuario.getExternalIdentityId()).stream()
                .map(KeycloakAdminClient.GrupoDoUsuario::caminho)
                .collect(Collectors.toSet());
    }

    /** Inclui o usuário nos subgrupos informados (caminhos completos) e revoga seus tokens. */
    public void incluirNosGrupos(Usuario usuario, List<String> caminhos) {
        caminhos.forEach(c -> keycloak.adicionarMembro(usuario.getExternalIdentityId(), grupo(c)));
        revogacaoTokenService.revogarTokensDoUsuario(usuario);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void adicionarVinculos(Map<UUID, List<ParticipanteDTO.Vinculo>> vinculos, String caminho,
                                   PapelProjeto papel, String origem) {
        for (UUID kcId : membros(caminho)) {
            vinculos.computeIfAbsent(kcId, k -> new ArrayList<>())
                    .add(new ParticipanteDTO.Vinculo(papel.name(), origem));
        }
    }

    private List<UUID> membros(String caminho) {
        return keycloak.buscarGrupoPorCaminho(caminho).map(keycloak::listarMembros).orElse(List.of());
    }

    private UUID grupo(String caminho) {
        return keycloak.buscarGrupoPorCaminho(caminho)
                .orElseThrow(() -> new OperacaoNaoPermitidaException("Grupo de acesso não encontrado: " + caminho));
    }

    private List<ParticipanteDTO> montarParticipantes(Map<UUID, List<ParticipanteDTO.Vinculo>> vinculos) {
        Map<UUID, Usuario> usuarios = usuarioRepository.findAllByExternalIdentityIdIn(vinculos.keySet()).stream()
                .collect(Collectors.toMap(Usuario::getExternalIdentityId, u -> u));
        return vinculos.entrySet().stream()
                .filter(e -> usuarios.containsKey(e.getKey()))   // conta do Keycloak sem usuário na plataforma é ignorada
                .map(e -> {
                    Usuario u = usuarios.get(e.getKey());
                    return new ParticipanteDTO(u.getId(), u.getNome(), u.getEmail(), u.getUrlMidiaPerfil(), e.getValue());
                })
                .sorted(Comparator.comparing(ParticipanteDTO::nome, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private Organizacao carregarOrganizacao(UUID id) {
        return organizacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Organização não encontrada: " + id));
    }

    private Projeto carregarProjeto(UUID id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Projeto não encontrado: " + id));
    }

    private Usuario carregarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado: " + id));
    }

    // Exceções de domínio

    public static class RecursoNaoEncontradoException extends RuntimeException {
        public RecursoNaoEncontradoException(String message) { super(message); }
    }

    public static class UsuarioNaoParticipaException extends RuntimeException {
        public UsuarioNaoParticipaException(String message) { super(message); }
    }

    public static class PapelJaAtribuidoException extends RuntimeException {
        public PapelJaAtribuidoException(String message) { super(message); }
    }

    public static class OperacaoNaoPermitidaException extends RuntimeException {
        public OperacaoNaoPermitidaException(String message) { super(message); }
    }
}
