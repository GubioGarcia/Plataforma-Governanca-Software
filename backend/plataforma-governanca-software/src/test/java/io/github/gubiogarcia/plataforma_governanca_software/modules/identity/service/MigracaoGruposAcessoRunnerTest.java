package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Teste unitário (sem Spring) do runner que cria grupos para dados anteriores à autorização. */
class MigracaoGruposAcessoRunnerTest {

    private OrganizacaoRepository organizacaoRepository;
    private ProjetoRepository projetoRepository;
    private UsuarioRepository usuarioRepository;
    private GruposAcessoService gruposAcessoService;
    private MigracaoGruposAcessoRunner runner;

    @BeforeEach
    void setUp() {
        organizacaoRepository = mock(OrganizacaoRepository.class);
        projetoRepository     = mock(ProjetoRepository.class);
        usuarioRepository     = mock(UsuarioRepository.class);
        gruposAcessoService   = mock(GruposAcessoService.class);

        PlatformTransactionManager tm = mock(PlatformTransactionManager.class);
        when(tm.getTransaction(any())).thenReturn(new SimpleTransactionStatus());

        runner = new MigracaoGruposAcessoRunner(
                organizacaoRepository, projetoRepository, usuarioRepository, gruposAcessoService, tm);
    }

    @Test
    void deveCriarGruposDeOrganizacoesEProjetosSemGrupo_comCriadorComoDono() {
        Usuario criador = Usuario.builder().id(UUID.randomUUID()).externalIdentityId(UUID.randomUUID()).build();
        Organizacao org = Organizacao.builder().id(UUID.randomUUID()).criadoPor(criador.getId()).build();
        Projeto proj = Projeto.builder().id(UUID.randomUUID()).organizacao(org).criadoPor(criador).build();
        UUID grupoOrg = UUID.randomUUID(), grupoProj = UUID.randomUUID();

        when(organizacaoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of(org));
        when(projetoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of(proj));
        when(organizacaoRepository.findById(org.getId())).thenReturn(Optional.of(org));
        when(projetoRepository.findById(proj.getId())).thenReturn(Optional.of(proj));
        when(usuarioRepository.findById(criador.getId())).thenReturn(Optional.of(criador));
        when(gruposAcessoService.criarEstruturaOrganizacao(org, criador)).thenReturn(grupoOrg);
        when(gruposAcessoService.criarEstruturaProjeto(proj, criador)).thenReturn(grupoProj);

        runner.run(null);

        assertThat(org.getKeycloakGroupId()).isEqualTo(grupoOrg);
        assertThat(proj.getKeycloakGroupId()).isEqualTo(grupoProj);
    }

    @Test
    void deveContinuarComOsDemais_quandoUmaOrganizacaoFalha() {
        Organizacao falha = Organizacao.builder().id(UUID.randomUUID()).build();
        Organizacao ok    = Organizacao.builder().id(UUID.randomUUID()).build();
        UUID grupoOk = UUID.randomUUID();

        when(organizacaoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of(falha, ok));
        when(projetoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of());
        when(organizacaoRepository.findById(falha.getId())).thenReturn(Optional.of(falha));
        when(organizacaoRepository.findById(ok.getId())).thenReturn(Optional.of(ok));
        when(gruposAcessoService.criarEstruturaOrganizacao(eq(falha), any()))
                .thenThrow(new GruposAcessoService.EstruturaGruposException("Keycloak fora do ar"));
        when(gruposAcessoService.criarEstruturaOrganizacao(eq(ok), any())).thenReturn(grupoOk);

        assertThatCode(() -> runner.run(null)).doesNotThrowAnyException();

        assertThat(falha.getKeycloakGroupId()).isNull();
        assertThat(ok.getKeycloakGroupId()).isEqualTo(grupoOk);
    }

    @Test
    void naoDeveFazerNada_quandoTodosJaTemGrupo() {
        when(organizacaoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of());
        when(projetoRepository.findAllByKeycloakGroupIdIsNull()).thenReturn(List.of());

        runner.run(null);

        verifyNoInteractions(gruposAcessoService);
    }
}
