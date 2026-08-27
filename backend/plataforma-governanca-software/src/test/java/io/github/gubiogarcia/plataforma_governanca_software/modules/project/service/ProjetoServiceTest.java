package io.github.gubiogarcia.plataforma_governanca_software.modules.project.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.repository.VisaoProdutoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Testes de integração para ProjetoService.
 *
 * Pré-condições provisionadas em @BeforeEach:
 *  - Usuário com externalIdentityId conhecido (vinculado ao jwtMock).
 *  - StatusProjeto "RASCUNHO" (exigido em criar).
 *  - Organizacao ativa (org padrão dos testes).
 *
 * Todos os testes rodam numa transação que é revertida ao final.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class ProjetoServiceTest {

    @Autowired private ProjetoService projetoService;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private VisaoProdutoRepository visaoProdutoRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private Organizacao organizacaoAtiva;
    private StatusProjeto statusRascunho;
    private StatusProjeto statusEmRevisao;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId)
                .nome("PM de Teste")
                .email("pm@projeto-teste.com")
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        // Status exigido por ProjetoService.criar() — deve existir com nome "RASCUNHO"
        statusRascunho = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("RASCUNHO")
                .descricao("Projeto em elaboração inicial")
                .ordem(1)
                .build());

        statusEmRevisao = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("EM_REVISAO")
                .descricao("Projeto em análise de revisão")
                .ordem(2)
                .build());

        organizacaoAtiva = organizacaoRepository.save(Organizacao.builder()
                .nome("Organização Teste de Projetos")
                .descricao("Org para testes de ProjetoService")
                .ativo(true)
                .criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        entityManager.flush();
    }

    // ─── criar ───────────────────────────────────────────────────────────────

    @Test
    void criar_deveInserirProjetoNoBanco_quandoDadosValidos() {
        // Given
        var request = new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Sistema ERP", "Gestão integrada");

        // When
        var resultado = projetoService.criar(jwtMock, request);

        // Then — verifica o DTO retornado
        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("Sistema ERP");
        assertThat(resultado.descricao()).isEqualTo("Gestão integrada");
        assertThat(resultado.ativo()).isTrue();
        assertThat(resultado.status().nome()).isEqualTo("RASCUNHO");
        assertThat(resultado.organizacaoId()).isEqualTo(organizacaoAtiva.getId());

        // Then — verifica o registro persistido no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = projetoRepository.findById(resultado.id());
        assertThat(salvo).isPresent();
        assertThat(salvo.get().getNome()).isEqualTo("Sistema ERP");
        assertThat(salvo.get().getAtivo()).isTrue();
        assertThat(salvo.get().getStatus().getNome()).isEqualTo("RASCUNHO");
        assertThat(salvo.get().getCriadoPor()).isNotNull();
    }

    @Test
    void criar_deveInicializarVisaoProdutoAutomaticamente_quandoProjetoCriado() {
        // Given
        var request = new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Projeto com Wiki", null);

        // When
        var resultado = projetoService.criar(jwtMock, request);

        // Then — VisaoProduto deve ter sido criada automaticamente no banco
        entityManager.flush();
        entityManager.clear();

        assertThat(visaoProdutoRepository.existsByProjetoId(resultado.id()))
                .as("Uma VisaoProduto (Wiki) deve ser inicializada na criação do projeto")
                .isTrue();
    }

    @Test
    void criar_deveLancarException_quandoOrganizacaoNaoEncontrada() {
        // Given
        var request = new CriarProjetoRequestDTO(UUID.randomUUID(), "Projeto Sem Org", null);

        // When / Then
        assertThatThrownBy(() -> projetoService.criar(jwtMock, request))
                .isInstanceOf(ProjetoService.OrganizacaoNaoEncontradaException.class);
    }

    @Test
    void criar_deveLancarException_quandoOrganizacaoInativa() {
        // Given
        Organizacao orgInativa = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Inativa Projeto Teste")
                .ativo(false)
                .criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());
        entityManager.flush();

        var request = new CriarProjetoRequestDTO(orgInativa.getId(), "Projeto Bloqueado", null);

        // When / Then — org inativa não deve aceitar novos projetos
        assertThatThrownBy(() -> projetoService.criar(jwtMock, request))
                .isInstanceOf(ProjetoService.OrganizacaoInativaException.class);
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicadoNaOrganizacao() {
        // Given
        projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Projeto Único", null));

        // When / Then — mesmo nome na mesma org deve ser rejeitado
        assertThatThrownBy(() ->
                projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Projeto Único", null))
        ).isInstanceOf(ProjetoService.ProjetoNomeJaExisteNaOrganizacaoException.class);
    }

    // ─── listarPorOrganizacao ─────────────────────────────────────────────────

    @Test
    void listarPorOrganizacao_deveRetornarProjetosDaOrganizacao() {
        // Given
        projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Gamma", null));
        projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Delta", null));

        // When
        var lista = projetoService.listarPorOrganizacao(organizacaoAtiva.getId(), null);

        // Then
        assertThat(lista).hasSizeGreaterThanOrEqualTo(2);
        assertThat(lista).extracting("nome").contains("Proj Gamma", "Proj Delta");
    }

    @Test
    void listarPorOrganizacao_deveLancarException_quandoOrganizacaoNaoExiste() {
        assertThatThrownBy(() -> projetoService.listarPorOrganizacao(UUID.randomUUID(), null))
                .isInstanceOf(ProjetoService.OrganizacaoNaoEncontradaException.class);
    }

    // ─── buscarPorId ─────────────────────────────────────────────────────────

    @Test
    void buscarPorId_deveRetornarProjetoExistente() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Para Busca", null));

        // When
        var encontrado = projetoService.buscarPorId(criado.id());

        // Then
        assertThat(encontrado.id()).isEqualTo(criado.id());
        assertThat(encontrado.nome()).isEqualTo("Proj Para Busca");
    }

    @Test
    void buscarPorId_deveLancarException_quandoNaoEncontrado() {
        assertThatThrownBy(() -> projetoService.buscarPorId(UUID.randomUUID()))
                .isInstanceOf(ProjetoService.ProjetoNaoEncontradoException.class);
    }

    // ─── atualizar ───────────────────────────────────────────────────────────

    @Test
    void atualizar_deveAtualizarRegistroNoBanco_quandoDadosValidos() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Original", "Desc original"));
        var request = new AtualizarProjetoRequestDTO("Proj Atualizado", "Nova desc", statusEmRevisao.getId());

        // When
        projetoService.atualizar(jwtMock, criado.id(), request);

        // Then — verifica a atualização persistida no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = projetoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getNome()).isEqualTo("Proj Atualizado");
        assertThat(salvo.getDescricao()).isEqualTo("Nova desc");
        assertThat(salvo.getStatus().getNome()).isEqualTo("EM_REVISAO");
    }

    @Test
    void atualizar_deveLancarException_quandoProjetoInativo() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Inativo Update", null));
        projetoService.inativar(jwtMock, criado.id());

        // When / Then — não é permitido editar projeto inativo
        assertThatThrownBy(() ->
                projetoService.atualizar(jwtMock, criado.id(),
                        new AtualizarProjetoRequestDTO("Novo Nome", null, statusRascunho.getId()))
        ).isInstanceOf(ProjetoService.ProjetoInativoException.class);
    }

    // ─── inativar ────────────────────────────────────────────────────────────

    @Test
    void inativar_deveDesativarProjetoNoBanco() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Para Inativar", null));

        // When
        projetoService.inativar(jwtMock, criado.id());

        // Then — ativo deve ser false no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = projetoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getAtivo()).isFalse();
    }

    @Test
    void inativar_deveLancarException_quandoJaInativo() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Dupla Inativacao", null));
        projetoService.inativar(jwtMock, criado.id());

        // When / Then — segunda inativação deve lançar exceção
        assertThatThrownBy(() -> projetoService.inativar(jwtMock, criado.id()))
                .isInstanceOf(ProjetoService.ProjetoJaInativoException.class);
    }

    // ─── ativar ──────────────────────────────────────────────────────────────

    @Test
    void ativar_deveReativarProjetoNoBanco() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Para Reativar", null));
        projetoService.inativar(jwtMock, criado.id());

        // When
        projetoService.ativar(jwtMock, criado.id());

        // Then — ativo deve ser true no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = projetoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getAtivo()).isTrue();
    }

    @Test
    void ativar_deveLancarException_quandoJaAtivo() {
        // Given
        var criado = projetoService.criar(jwtMock, new CriarProjetoRequestDTO(organizacaoAtiva.getId(), "Proj Dupla Ativacao", null));

        // When / Then — ativar um projeto já ativo deve lançar exceção
        assertThatThrownBy(() -> projetoService.ativar(jwtMock, criado.id()))
                .isInstanceOf(ProjetoService.ProjetoJaAtivoException.class);
    }
}
