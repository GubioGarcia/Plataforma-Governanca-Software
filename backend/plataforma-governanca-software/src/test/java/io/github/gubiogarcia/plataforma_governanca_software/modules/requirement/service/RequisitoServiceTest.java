package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Prioridade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.PrioridadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
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
 * Testes de integração para RequisitoService.
 *
 * Pré-condições provisionadas em @BeforeEach:
 *  - Usuário, Organizacao, StatusProjeto, Projeto (no banco H2).
 *  - StatusRequisito "RASCUNHO" (usado como default quando statusId não é informado).
 *  - Prioridade "Alta" (para testar vinculação de prioridade).
 *
 * Todos os testes rodam em uma transação revertida ao final.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class RequisitoServiceTest {

    @Autowired private RequisitoService requisitoService;
    @Autowired private RequisitoRepository requisitoRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusRequisitoRepository statusRequisitoRepository;
    @Autowired private PrioridadeRepository prioridadeRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private Projeto projeto;
    private StatusRequisito statusRascunho;
    private Prioridade prioridadeAlta;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId)
                .nome("Analista de Requisitos Teste")
                .email("analista@req-teste.com")
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto statusProjeto = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("RASCUNHO")
                .descricao("Em elaboração")
                .ordem(1)
                .build());

        // Status de requisito com menor ordem — será selecionado como default
        statusRascunho = statusRequisitoRepository.save(StatusRequisito.builder()
                .nome("RASCUNHO")
                .descricao("Requisito em elaboração inicial")
                .ordem(1)
                .build());

        prioridadeAlta = prioridadeRepository.save(Prioridade.builder()
                .codigo("ALTA")
                .nome("Alta")
                .descricao("Alta prioridade de negócio")
                .ordem(3)
                .ativo(true)
                .build());

        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Para Testes de Requisito")
                .ativo(true)
                .criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto de Requisitos")
                .organizacao(org)
                .status(statusProjeto)
                .criadoPor(usuario)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        entityManager.flush();
    }

    // ─── criar ───────────────────────────────────────────────────────────────

    @Test
    void criar_deveInserirRequisitoNoBanco_quandoDadosValidos() {
        // Given
        var request = new CriarRequisitoRequestDTO(
                "Login do usuário via e-mail",
                "O sistema deve permitir autenticação via e-mail e senha.",
                TipoRequisito.FUNCIONAL,
                statusRascunho.getId(),
                null
        );

        // When
        var resultado = requisitoService.criar(jwtMock, projeto.getId(), request);

        // Then — verifica o DTO retornado
        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.titulo()).isEqualTo("Login do usuário via e-mail");
        assertThat(resultado.codigo()).isEqualTo("REQ-001");
        assertThat(resultado.versao()).isEqualTo(1);
        assertThat(resultado.statusNome()).isEqualTo("RASCUNHO");

        // Then — verifica o registro persistido no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = requisitoRepository.findById(resultado.id());
        assertThat(salvo).isPresent();
        assertThat(salvo.get().getTitulo()).isEqualTo("Login do usuário via e-mail");
        assertThat(salvo.get().getCodigo()).isEqualTo("REQ-001");
        assertThat(salvo.get().getAtivo()).isTrue();
        assertThat(salvo.get().getVersao()).isEqualTo(1);
    }

    @Test
    void criar_deveGerarCodigoSequencialUnico_quandoCriandoMultiplosRequisitos() {
        // Given — nenhum requisito no projeto ainda
        // When
        var req1 = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Funcional 1", "Desc 1", TipoRequisito.FUNCIONAL, null, null));
        var req2 = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Funcional 2", "Desc 2", TipoRequisito.NAO_FUNCIONAL, null, null));
        var req3 = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Funcional 3", "Desc 3", TipoRequisito.TECNICO, null, null));

        // Then — códigos devem ser sequenciais e únicos
        assertThat(req1.codigo()).isEqualTo("REQ-001");
        assertThat(req2.codigo()).isEqualTo("REQ-002");
        assertThat(req3.codigo()).isEqualTo("REQ-003");
    }

    @Test
    void criar_deveVincularPrioridade_quandoPrioridadeInformada() {
        // Given
        var request = new CriarRequisitoRequestDTO(
                "Req com Prioridade Alta",
                "Requisito crítico de segurança.",
                TipoRequisito.FUNCIONAL,
                null,
                prioridadeAlta.getId()
        );

        // When
        var resultado = requisitoService.criar(jwtMock, projeto.getId(), request);

        // Then — verifica a prioridade vinculada no banco
        assertThat(resultado.prioridadeNome()).isEqualTo("Alta");

        entityManager.flush();
        entityManager.clear();

        var salvo = requisitoRepository.findById(resultado.id()).orElseThrow();
        assertThat(salvo.getPrioridade()).isNotNull();
        assertThat(salvo.getPrioridade().getNome()).isEqualTo("Alta");
    }

    @Test
    void criar_deveLancarException_quandoProjetoNaoEncontrado() {
        // Given
        var request = new CriarRequisitoRequestDTO("Req Órfão", "Desc", TipoRequisito.FUNCIONAL, null, null);

        // When / Then
        assertThatThrownBy(() -> requisitoService.criar(jwtMock, UUID.randomUUID(), request))
                .isInstanceOf(RequisitoService.ProjetoNaoEncontradoException.class);
    }

    @Test
    void criar_deveLancarException_quandoStatusNaoEncontrado() {
        // Given — UUID de status inexistente
        UUID statusInexistente = UUID.randomUUID();
        var request = new CriarRequisitoRequestDTO("Req Status Invalido", "Desc", TipoRequisito.FUNCIONAL, statusInexistente, null);

        // When / Then
        assertThatThrownBy(() -> requisitoService.criar(jwtMock, projeto.getId(), request))
                .isInstanceOf(StatusRequisitoService.StatusRequisitoNaoEncontradoException.class);
    }

    // ─── listarPorProjeto ─────────────────────────────────────────────────────

    @Test
    void listarPorProjeto_deveRetornarSomenteRequisitosAtivos() {
        // Given
        var reqAtivo = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Ativo", "Desc", TipoRequisito.FUNCIONAL, null, null));
        var reqInativo = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Inativo", "Desc", TipoRequisito.FUNCIONAL, null, null));
        requisitoService.deletar(jwtMock, reqInativo.id());

        // When
        var lista = requisitoService.listarPorProjeto(projeto.getId());

        // Then — somente o req ativo deve aparecer na listagem
        assertThat(lista).extracting("titulo").contains("Req Ativo");
        assertThat(lista).extracting("titulo").doesNotContain("Req Inativo");
    }

    // ─── buscarPorId ─────────────────────────────────────────────────────────

    @Test
    void buscarPorId_deveRetornarRequisitoExistente() {
        // Given
        var criado = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Para Busca", "Desc busca", TipoRequisito.REGRA_NEGOCIO, null, null));

        // When
        var encontrado = requisitoService.buscarPorId(criado.id());

        // Then
        assertThat(encontrado.id()).isEqualTo(criado.id());
        assertThat(encontrado.titulo()).isEqualTo("Req Para Busca");
        assertThat(encontrado.codigo()).isEqualTo("REQ-001");
    }

    @Test
    void buscarPorId_deveLancarException_quandoNaoEncontrado() {
        assertThatThrownBy(() -> requisitoService.buscarPorId(UUID.randomUUID()))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }

    // ─── atualizar ───────────────────────────────────────────────────────────

    @Test
    void atualizar_deveAtualizarCamposEIncrementarVersaoNoBanco() {
        // Given
        var criado = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Original", "Desc original", TipoRequisito.FUNCIONAL, null, null));
        assertThat(criado.versao()).isEqualTo(1);

        var request = new AtualizarRequisitoRequestDTO(
                "Req Atualizado", "Nova descrição", TipoRequisito.NAO_FUNCIONAL, null, null
        );

        // When
        var atualizado = requisitoService.atualizar(jwtMock, criado.id(), request);

        // Then — versão deve ter sido incrementada para 2
        assertThat(atualizado.versao()).isEqualTo(2);
        assertThat(atualizado.titulo()).isEqualTo("Req Atualizado");

        // Then — verifica a atualização persistida no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = requisitoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getTitulo()).isEqualTo("Req Atualizado");
        assertThat(salvo.getDescricao()).isEqualTo("Nova descrição");
        assertThat(salvo.getVersao()).isEqualTo(2);
    }

    @Test
    void atualizar_deveAtualizarPrioridade_quandoInformada() {
        // Given — requisito sem prioridade inicial
        var criado = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Sem Prioridade", "Desc", TipoRequisito.FUNCIONAL, null, null));

        var request = new AtualizarRequisitoRequestDTO(null, null, null, null, prioridadeAlta.getId());

        // When
        requisitoService.atualizar(jwtMock, criado.id(), request);

        // Then — prioridade deve ter sido persistida no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = requisitoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getPrioridade()).isNotNull();
        assertThat(salvo.getPrioridade().getNome()).isEqualTo("Alta");
    }

    @Test
    void atualizar_deveLancarException_quandoNaoEncontrado() {
        var request = new AtualizarRequisitoRequestDTO("Título", "Desc", TipoRequisito.FUNCIONAL, null, null);

        assertThatThrownBy(() -> requisitoService.atualizar(jwtMock, UUID.randomUUID(), request))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }

    // ─── deletar ─────────────────────────────────────────────────────────────

    @Test
    void deletar_deveFazerSoftDeleteNoBanco_mantendoRegistro() {
        // Given
        var criado = requisitoService.criar(jwtMock, projeto.getId(),
                new CriarRequisitoRequestDTO("Req Para Deletar", "Desc", TipoRequisito.FUNCIONAL, null, null));

        // When
        requisitoService.deletar(jwtMock, criado.id());

        // Then — registro ainda existe no banco, mas com ativo = false (soft delete)
        entityManager.flush();
        entityManager.clear();

        var salvo = requisitoRepository.findById(criado.id());
        assertThat(salvo).isPresent();
        assertThat(salvo.get().getAtivo()).isFalse();
    }

    @Test
    void deletar_deveLancarException_quandoNaoEncontrado() {
        assertThatThrownBy(() -> requisitoService.deletar(jwtMock, UUID.randomUUID()))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }
}
