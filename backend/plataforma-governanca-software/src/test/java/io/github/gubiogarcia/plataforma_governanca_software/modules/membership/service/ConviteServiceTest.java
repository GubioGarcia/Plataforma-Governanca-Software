package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminClient.GrupoDoUsuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.PapelConvite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.StatusConvite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto.ConviteDTOs.CriarConviteRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.repository.ConviteRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Convites (Fase 6 / Passo 4): criação, regras, aceite com inclusão no grupo, expiração e cancelamento. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class ConviteServiceTest {

    @Autowired private ConviteService conviteService;
    @Autowired private ConviteRepository conviteRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;

    @MockitoBean private JwtDecoder jwtDecoder;
    @MockitoBean private KeycloakAdminClient keycloak;

    private Usuario dono, convidado;
    private Organizacao org;
    private Projeto projeto;
    private final Map<String, UUID> grupos = new HashMap<>();
    private final Map<UUID, List<String>> gruposPorUsuario = new HashMap<>();

    private UUID id(String caminho) { return grupos.computeIfAbsent(caminho, c -> UUID.randomUUID()); }
    private String org(String sub)  { return "/org-" + org.getId() + "/" + sub; }
    private String proj(String sub) { return "/org-" + org.getId() + "/proj-" + projeto.getId() + "/" + sub; }

    @BeforeEach
    void setUp() {
        dono = salvarUsuario("dono.convite@x.com");
        convidado = salvarUsuario("convidado.convite@x.com");
        org = organizacaoRepository.save(Organizacao.builder().nome("Org Convites").ativo(true)
                .criadoPor(dono.getId()).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        projeto = projetoRepository.save(Projeto.builder().nome("Proj Convites").organizacao(org).status(sp)
                .criadoPor(dono).ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        when(keycloak.buscarGrupoPorCaminho(anyString())).thenAnswer(inv -> Optional.of(id(inv.getArgument(0))));
        when(keycloak.listarGruposDoUsuario(any())).thenAnswer(inv ->
                gruposPorUsuario.getOrDefault((UUID) inv.getArgument(0), List.of()).stream()
                        .map(c -> new GrupoDoUsuario(id(c), c)).toList());
        comoDono();
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private Usuario salvarUsuario(String email) {
        return usuarioRepository.save(Usuario.builder().externalIdentityId(UUID.randomUUID()).nome(email).email(email)
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
    }

    private void comoDono()      { AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), org("_dono")); }
    private void comoConvidado() { AutenticacaoTeste.comGrupos(convidado.getExternalIdentityId()); }

    private UUID convidarOrg(PapelConvite papel) {
        return conviteService.convidarParaOrganizacao(org.getId(), new CriarConviteRequestDTO(convidado.getEmail(), papel)).id();
    }

    // ── Criar ─────────────────────────────────────────────────────────────────

    @Test
    void convidarParaOrganizacao_ficaPendenteComValidadeDe7Dias() {
        var convite = conviteService.convidarParaOrganizacao(org.getId(),
                new CriarConviteRequestDTO("  Convidado.Convite@X.com ", PapelConvite.MEMBRO));

        assertThat(convite.status()).isEqualTo(StatusConvite.PENDENTE);
        assertThat(convite.email()).isEqualTo("convidado.convite@x.com");   // normalizado
        assertThat(Duration.between(convite.dataCriacao(), convite.expiraEm())).isEqualTo(Duration.ofDays(7));
        assertThat(convite.convidadoPorNome()).isEqualTo(dono.getNome());
    }

    @Test
    void convidar_regrasDePapelDuplicidadeEPermissao() {
        assertThatThrownBy(() -> convidarOrg(PapelConvite.STAKEHOLDER))
                .isInstanceOf(ConviteService.ConviteInvalidoException.class);
        assertThatThrownBy(() -> conviteService.convidarParaProjeto(projeto.getId(),
                new CriarConviteRequestDTO(convidado.getEmail(), PapelConvite.MEMBRO)))
                .isInstanceOf(ConviteService.ConviteInvalidoException.class);

        convidarOrg(PapelConvite.MEMBRO);
        assertThatThrownBy(() -> convidarOrg(PapelConvite.GESTOR))
                .isInstanceOf(ConviteService.ConviteDuplicadoException.class);

        AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), org("_membros"));   // Membro não convida
        assertThatThrownBy(() -> conviteService.convidarParaProjeto(projeto.getId(),
                new CriarConviteRequestDTO("outro@x.com", PapelConvite.STAKEHOLDER)))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void convidar_quemJaParticipa_eRecusado() {
        gruposPorUsuario.put(convidado.getExternalIdentityId(), List.of(org("_membros")));

        assertThatThrownBy(() -> convidarOrg(PapelConvite.GESTOR))
                .isInstanceOf(ConviteService.ConviteDuplicadoException.class);
        // Membro da org já é Stakeholder Técnico em todo projeto dela
        assertThatThrownBy(() -> conviteService.convidarParaProjeto(projeto.getId(),
                new CriarConviteRequestDTO(convidado.getEmail(), PapelConvite.STAKEHOLDER)))
                .isInstanceOf(ConviteService.ConviteDuplicadoException.class);
    }

    // ── Responder ─────────────────────────────────────────────────────────────

    @Test
    void aceitarConviteDeOrganizacao_incluiNoSubgrupoDoPapel_eRevogaTokens() {
        UUID conviteId = convidarOrg(PapelConvite.GESTOR);

        comoConvidado();
        assertThat(conviteService.listarMeus()).extracting(c -> c.id()).containsExactly(conviteId);
        var aceito = conviteService.aceitar(conviteId);

        assertThat(aceito.status()).isEqualTo(StatusConvite.ACEITO);
        verify(keycloak).adicionarMembro(convidado.getExternalIdentityId(), id(org("_gestores")));
        assertThat(usuarioRepository.findById(convidado.getId()).orElseThrow().getTokensRevogadosAntesDe()).isNotNull();
        assertThat(conviteService.listarMeus()).isEmpty();
    }

    @Test
    void aceitarConviteDeProjetoComoStakeholder_entraComoTecnicoECliente() { // D9
        UUID conviteId = conviteService.convidarParaProjeto(projeto.getId(),
                new CriarConviteRequestDTO(convidado.getEmail(), PapelConvite.STAKEHOLDER)).id();

        comoConvidado();
        conviteService.aceitar(conviteId);

        verify(keycloak).adicionarMembro(convidado.getExternalIdentityId(), id(proj("_stakeholders_tecnicos")));
        verify(keycloak).adicionarMembro(convidado.getExternalIdentityId(), id(proj("_stakeholders_clientes")));
        verify(keycloak, never()).adicionarMembro(any(), eq(id(org("_membros"))));   // nunca mexe na org
    }

    @Test
    void aceitar_soOConvidado_eSoSePendenteENaoExpirado() {
        UUID conviteId = convidarOrg(PapelConvite.MEMBRO);

        // outro usuário (o próprio dono) não aceita
        assertThatThrownBy(() -> conviteService.aceitar(conviteId)).isInstanceOf(AcessoNegadoException.class);

        var convite = conviteRepository.findById(conviteId).orElseThrow();
        convite.setExpiraEm(Instant.now().minusSeconds(1));
        conviteRepository.save(convite);

        comoConvidado();
        assertThatThrownBy(() -> conviteService.aceitar(conviteId)).isInstanceOf(ConviteService.ConviteInvalidoException.class);
        assertThat(conviteRepository.findById(conviteId).orElseThrow().getStatus()).isEqualTo(StatusConvite.EXPIRADO);
        verify(keycloak, never()).adicionarMembro(any(), any());
    }

    @Test
    void recusar_eCancelar() {
        UUID recusado = convidarOrg(PapelConvite.MEMBRO);
        comoConvidado();
        assertThat(conviteService.recusar(recusado).status()).isEqualTo(StatusConvite.RECUSADO);

        comoDono();
        UUID cancelado = conviteService.convidarParaProjeto(projeto.getId(),
                new CriarConviteRequestDTO(convidado.getEmail(), PapelConvite.STAKEHOLDER)).id();
        assertThat(conviteService.listarDoProjeto(projeto.getId())).hasSize(1);
        conviteService.cancelar(cancelado);
        assertThat(conviteRepository.findById(cancelado).orElseThrow().getStatus()).isEqualTo(StatusConvite.CANCELADO);
        assertThat(conviteService.listarDoProjeto(projeto.getId())).isEmpty();
        assertThatThrownBy(() -> conviteService.cancelar(cancelado)).isInstanceOf(ConviteService.ConviteInvalidoException.class);
    }
}
