package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.Convite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.PapelConvite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.StatusConvite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ConviteDTOs.ConviteResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ConviteDTOs.CriarConviteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.repository.ConviteRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.ResolucaoPapeis;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.EstruturaGrupos.*;

/**
 * Convites (Passo 4 do doc de autorização).
 *
 * O convite é guardado pelo e-mail; quem já tem conta vê o convite ao entrar e aceita
 * — só então entra no grupo do Keycloak. Quem não tem conta se cadastra com o mesmo
 * e-mail e aceita em seguida. (O envio de e-mail pelo Keycloak — execute-actions-email —
 * fica para quando houver SMTP configurado.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConviteService {

    static final Duration VALIDADE = Duration.ofDays(7);

    private final ConviteRepository conviteRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembrosService membrosService;
    private final AutorizacaoService autorizacao;

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Transactional
    public ConviteResponseDTO convidarParaOrganizacao(UUID organizacaoId, CriarConviteRequestDTO request) {
        Organizacao org = organizacaoRepository.findById(organizacaoId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Organização não encontrada: " + organizacaoId));
        autorizacao.exigir(org, Permissao.ORG_INVITE_USER);

        if (request.papel() != PapelConvite.GESTOR && request.papel() != PapelConvite.MEMBRO) {
            throw new ConviteInvalidoException("Na organização o convite é para GESTOR ou MEMBRO.");
        }
        if (Boolean.FALSE.equals(org.getAtivo())) {
            throw new ConviteInvalidoException("A organização está inativa.");
        }
        String email = normalizar(request.email());
        if (conviteRepository.existsByEmailIgnoreCaseAndOrganizacaoIdAndProjetoIsNullAndStatus(email, org.getId(), StatusConvite.PENDENTE)) {
            throw new ConviteDuplicadoException("Já existe um convite pendente para este e-mail nesta organização.");
        }
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            if (ResolucaoPapeis.papelNaOrganizacao(membrosService.caminhosDoUsuario(u), org.getId()).isPresent()) {
                throw new ConviteDuplicadoException("Este usuário já participa da organização.");
            }
        });

        return salvar(email, org, null, request.papel());
    }

    @Transactional
    public ConviteResponseDTO convidarParaProjeto(UUID projetoId, CriarConviteRequestDTO request) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Projeto não encontrado: " + projetoId));
        autorizacao.exigir(projeto, Permissao.PROJETO_INVITE_USER);

        if (request.papel() != PapelConvite.GESTOR && request.papel() != PapelConvite.STAKEHOLDER) {
            throw new ConviteInvalidoException("No projeto o convite é para GESTOR ou STAKEHOLDER.");
        }
        if (request.papel() == PapelConvite.GESTOR) {
            autorizacao.exigir(projeto, Permissao.PROJETO_PROMOTE_USER);
        }
        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ConviteInvalidoException("O projeto está inativo.");
        }
        String email = normalizar(request.email());
        if (conviteRepository.existsByEmailIgnoreCaseAndProjetoIdAndStatus(email, projeto.getId(), StatusConvite.PENDENTE)) {
            throw new ConviteDuplicadoException("Já existe um convite pendente para este e-mail neste projeto.");
        }
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            if (!ResolucaoPapeis.papeisNoProjeto(membrosService.caminhosDoUsuario(u),
                    projeto.getOrganizacao().getId(), projeto.getId()).isEmpty()) {
                throw new ConviteDuplicadoException("Este usuário já participa do projeto.");
            }
        });

        return salvar(email, projeto.getOrganizacao(), projeto, request.papel());
    }

    // ── Listar ────────────────────────────────────────────────────────────────

    @Transactional
    public List<ConviteResponseDTO> listarDaOrganizacao(UUID organizacaoId) {
        Organizacao org = organizacaoRepository.findById(organizacaoId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Organização não encontrada: " + organizacaoId));
        autorizacao.exigir(org, Permissao.ORG_INVITE_USER);
        return pendentes(conviteRepository.findAllByOrganizacaoIdAndProjetoIsNullAndStatusOrderByDataCriacaoDesc(
                organizacaoId, StatusConvite.PENDENTE));
    }

    @Transactional
    public List<ConviteResponseDTO> listarDoProjeto(UUID projetoId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Projeto não encontrado: " + projetoId));
        autorizacao.exigir(projeto, Permissao.PROJETO_INVITE_USER);
        return pendentes(conviteRepository.findAllByProjetoIdAndStatusOrderByDataCriacaoDesc(projetoId, StatusConvite.PENDENTE));
    }

    /** Convites pendentes endereçados ao e-mail do usuário autenticado. */
    @Transactional
    public List<ConviteResponseDTO> listarMeus() {
        Usuario usuario = usuarioAtual();
        return pendentes(conviteRepository.findAllByEmailIgnoreCaseAndStatusOrderByDataCriacaoDesc(
                usuario.getEmail(), StatusConvite.PENDENTE));
    }

    // ── Responder ─────────────────────────────────────────────────────────────

    /** Aceite: inclui o usuário nos subgrupos do papel convidado e revoga seus tokens. */
    @Transactional
    public ConviteResponseDTO aceitar(UUID conviteId) {
        Usuario usuario = usuarioAtual();
        Convite convite = conviteDoUsuario(conviteId, usuario);

        UUID orgId = convite.getOrganizacao().getId();
        List<String> grupos;
        if (convite.getProjeto() == null) {
            String org = caminhoOrganizacao(orgId);
            grupos = List.of(org + "/" + (convite.getPapel() == PapelConvite.GESTOR ? GESTORES : MEMBROS));
        } else {
            String proj = caminhoProjeto(orgId, convite.getProjeto().getId());
            grupos = convite.getPapel() == PapelConvite.GESTOR
                    ? List.of(proj + "/" + GESTORES)
                    // Stakeholder entra como Técnico e Cliente (D9)
                    : List.of(proj + "/" + STAKEHOLDERS_TECNICOS, proj + "/" + STAKEHOLDERS_CLIENTES);
        }
        membrosService.incluirNosGrupos(usuario, grupos);

        convite.setStatus(StatusConvite.ACEITO);
        convite.setDataResposta(Instant.now());
        log.info("Convite {} aceito por {}.", conviteId, usuario.getId());
        return mapear(conviteRepository.save(convite));
    }

    @Transactional
    public ConviteResponseDTO recusar(UUID conviteId) {
        Convite convite = conviteDoUsuario(conviteId, usuarioAtual());
        convite.setStatus(StatusConvite.RECUSADO);
        convite.setDataResposta(Instant.now());
        return mapear(conviteRepository.save(convite));
    }

    /** Cancelar exige a mesma permissão de convidar no escopo do convite. */
    @Transactional
    public void cancelar(UUID conviteId) {
        Convite convite = conviteRepository.findById(conviteId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Convite não encontrado: " + conviteId));
        if (convite.getProjeto() == null) {
            autorizacao.exigir(convite.getOrganizacao(), Permissao.ORG_INVITE_USER);
        } else {
            autorizacao.exigir(convite.getProjeto(), Permissao.PROJETO_INVITE_USER);
        }
        if (convite.getStatus() != StatusConvite.PENDENTE) {
            throw new ConviteInvalidoException("Só convites pendentes podem ser cancelados.");
        }
        convite.setStatus(StatusConvite.CANCELADO);
        convite.setDataResposta(Instant.now());
        conviteRepository.save(convite);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ConviteResponseDTO salvar(String email, Organizacao org, Projeto projeto, PapelConvite papel) {
        Instant agora = Instant.now();
        Convite convite = conviteRepository.save(Convite.builder()
                .email(email)
                .organizacao(org)
                .projeto(projeto)
                .papel(papel)
                .status(StatusConvite.PENDENTE)
                .convidadoPor(usuarioAtual())
                .dataCriacao(agora)
                .expiraEm(agora.plus(VALIDADE))
                .build());
        log.info("Convite {} criado para {} ({} em {}).", convite.getId(), email, papel,
                projeto != null ? "projeto " + projeto.getId() : "organização " + org.getId());
        return mapear(convite);
    }

    /** Convite pendente, não expirado e endereçado ao e-mail do usuário. */
    private Convite conviteDoUsuario(UUID conviteId, Usuario usuario) {
        Convite convite = conviteRepository.findById(conviteId)
                .orElseThrow(() -> new MembrosService.RecursoNaoEncontradoException("Convite não encontrado: " + conviteId));
        if (!convite.getEmail().equalsIgnoreCase(usuario.getEmail())) {
            throw new AcessoNegadoException("Este convite não é para você.");
        }
        expirarSeVencido(convite);
        if (convite.getStatus() != StatusConvite.PENDENTE) {
            throw new ConviteInvalidoException("Este convite não está mais pendente (" + convite.getStatus() + ").");
        }
        return convite;
    }

    private List<ConviteResponseDTO> pendentes(List<Convite> convites) {
        convites.forEach(this::expirarSeVencido);
        return convites.stream()
                .filter(c -> c.getStatus() == StatusConvite.PENDENTE)
                .map(this::mapear)
                .toList();
    }

    private void expirarSeVencido(Convite convite) {
        if (convite.getStatus() == StatusConvite.PENDENTE && Instant.now().isAfter(convite.getExpiraEm())) {
            convite.setStatus(StatusConvite.EXPIRADO);
            conviteRepository.save(convite);
        }
    }

    private Usuario usuarioAtual() {
        return usuarioRepository.findByExternalIdentityId(autorizacao.keycloakIdAtual())
                .orElseThrow(() -> new AcessoNegadoException("Usuário autenticado não encontrado na plataforma."));
    }

    private static String normalizar(String email) {
        return email.trim().toLowerCase();
    }

    private ConviteResponseDTO mapear(Convite c) {
        return new ConviteResponseDTO(
                c.getId(), c.getEmail(),
                c.getOrganizacao().getId(), c.getOrganizacao().getNome(),
                c.getProjeto() != null ? c.getProjeto().getId() : null,
                c.getProjeto() != null ? c.getProjeto().getNome() : null,
                c.getPapel(), c.getStatus(),
                c.getConvidadoPor() != null ? c.getConvidadoPor().getNome() : null,
                c.getDataCriacao(), c.getExpiraEm());
    }

    // Exceções de domínio

    public static class ConviteInvalidoException extends RuntimeException {
        public ConviteInvalidoException(String message) { super(message); }
    }

    public static class ConviteDuplicadoException extends RuntimeException {
        public ConviteDuplicadoException(String message) { super(message); }
    }
}
