package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.AtualizarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.CriarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
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
 * Testes de integração para OrganizacaoService.
 *
 * Estratégia:
 *  - Usa H2 em memória via perfil "test".
 *  - @Transactional garante rollback após cada teste.
 *  - O Jwt é mockado com Mockito — não ocorre validação real de token.
 *  - entityManager.flush/clear força leitura do banco (não do cache JPA).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class OrganizacaoServiceTest {

    @Autowired private OrganizacaoService organizacaoService;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private Jwt jwtMock;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();

        usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId)
                .nome("Usuário Org Teste")
                .email("org-teste@exemplo.com")
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());
    }

    // ─── criar ───────────────────────────────────────────────────────────────

    @Test
    void criar_deveInserirOrganizacaoNoBanco_quandoDadosValidos() {
        // Given
        var request = new CriarOrganizacaoRequestDTO("Minha Empresa TI", "Empresa de tecnologia", "PRO");

        // When
        var resultado = organizacaoService.criar(jwtMock, request);

        // Then — verifica o DTO retornado
        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("Minha Empresa TI");
        assertThat(resultado.plano()).isEqualTo("PRO");
        assertThat(resultado.ativo()).isTrue();

        // Then — verifica o registro persistido no banco
        entityManager.flush();
        entityManager.clear();

        var salva = organizacaoRepository.findById(resultado.id());
        assertThat(salva).isPresent();
        assertThat(salva.get().getNome()).isEqualTo("Minha Empresa TI");
        assertThat(salva.get().getDescricao()).isEqualTo("Empresa de tecnologia");
        assertThat(salva.get().getAtivo()).isTrue();
        assertThat(salva.get().getCriadoPor()).isNotNull();
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicado() {
        // Given
        organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Empresa Única", null, null));

        // When / Then — mesmo nome deve ser rejeitado
        assertThatThrownBy(() ->
                organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Empresa Única", "Desc", null))
        ).isInstanceOf(OrganizacaoService.OrganizacaoNomeJaExisteException.class);
    }

    // ─── listar ──────────────────────────────────────────────────────────────

    @Test
    void listar_deveRetornarTodasOrganizacoes_quandoSemFiltro() {
        // Given
        organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Alpha", null, null));
        organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Beta", null, null));

        // When
        var lista = organizacaoService.listar(null);

        // Then
        assertThat(lista).hasSizeGreaterThanOrEqualTo(2);
        assertThat(lista).extracting("nome").contains("Org Alpha", "Org Beta");
    }

    @Test
    void listar_deveRetornarSomenteAtivas_quandoFiltroAtivo() {
        // Given
        organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Ativa", null, null));
        var inativa = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Inativa", null, null));
        organizacaoService.inativar(inativa.id());

        // When
        var lista = organizacaoService.listar(true);

        // Then — "Org Ativa" presente, "Org Inativa" ausente
        assertThat(lista).extracting("nome").contains("Org Ativa");
        assertThat(lista).extracting("nome").doesNotContain("Org Inativa");
    }

    @Test
    void listar_deveRetornarSomenteInativas_quandoFiltroInativo() {
        // Given
        organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Visivel", null, null));
        var inativa = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Arquivada", null, null));
        organizacaoService.inativar(inativa.id());

        // When
        var lista = organizacaoService.listar(false);

        // Then
        assertThat(lista).extracting("nome").contains("Org Arquivada");
        assertThat(lista).extracting("nome").doesNotContain("Org Visivel");
    }

    // ─── buscarPorId ─────────────────────────────────────────────────────────

    @Test
    void buscarPorId_deveRetornarOrganizacaoExistente() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Para Busca", null, null));

        // When
        var encontrada = organizacaoService.buscarPorId(criada.id());

        // Then
        assertThat(encontrada.id()).isEqualTo(criada.id());
        assertThat(encontrada.nome()).isEqualTo("Org Para Busca");
    }

    @Test
    void buscarPorId_deveLancarException_quandoNaoEncontrada() {
        assertThatThrownBy(() -> organizacaoService.buscarPorId(UUID.randomUUID()))
                .isInstanceOf(OrganizacaoService.OrganizacaoNaoEncontradaException.class);
    }

    // ─── atualizar ───────────────────────────────────────────────────────────

    @Test
    void atualizar_deveAtualizarRegistroNoBanco_quandoDadosValidos() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Original", "Desc original", "FREE"));
        var request = new AtualizarOrganizacaoRequestDTO("Org Atualizada", "Nova desc", "ENTERPRISE");

        // When
        organizacaoService.atualizar(criada.id(), request);

        // Then — verifica a atualização persistida no banco
        entityManager.flush();
        entityManager.clear();

        var salva = organizacaoRepository.findById(criada.id()).orElseThrow();
        assertThat(salva.getNome()).isEqualTo("Org Atualizada");
        assertThat(salva.getDescricao()).isEqualTo("Nova desc");
        assertThat(salva.getPlano()).isEqualTo("ENTERPRISE");
    }

    @Test
    void atualizar_deveLancarException_quandoOrganizacaoInativa() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Para Inativar Edit", null, null));
        organizacaoService.inativar(criada.id());

        // When / Then — não é permitido editar org inativa
        assertThatThrownBy(() ->
                organizacaoService.atualizar(criada.id(), new AtualizarOrganizacaoRequestDTO("Novo Nome", null, null))
        ).isInstanceOf(OrganizacaoService.OrganizacaoInativaException.class);
    }

    // ─── inativar ────────────────────────────────────────────────────────────

    @Test
    void inativar_deveDesativarOrganizacaoNoBanco() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Para Inativar", null, null));

        // When
        organizacaoService.inativar(criada.id());

        // Then — ativo deve ser false no banco
        entityManager.flush();
        entityManager.clear();

        var salva = organizacaoRepository.findById(criada.id()).orElseThrow();
        assertThat(salva.getAtivo()).isFalse();
    }

    @Test
    void inativar_deveLancarException_quandoJaInativa() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Dupla Inativacao", null, null));
        organizacaoService.inativar(criada.id());

        // When / Then — segunda inativação deve lançar exceção
        assertThatThrownBy(() -> organizacaoService.inativar(criada.id()))
                .isInstanceOf(OrganizacaoService.OrganizacaoJaInativaException.class);
    }

    // ─── ativar ──────────────────────────────────────────────────────────────

    @Test
    void ativar_deveReativarOrganizacaoNoBanco() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Para Reativar", null, null));
        organizacaoService.inativar(criada.id());

        // When
        organizacaoService.ativar(criada.id());

        // Then — ativo deve ser true no banco
        entityManager.flush();
        entityManager.clear();

        var salva = organizacaoRepository.findById(criada.id()).orElseThrow();
        assertThat(salva.getAtivo()).isTrue();
    }

    @Test
    void ativar_deveLancarException_quandoJaAtiva() {
        // Given
        var criada = organizacaoService.criar(jwtMock, new CriarOrganizacaoRequestDTO("Org Dupla Ativacao", null, null));

        // When / Then — ativar uma org já ativa deve lançar exceção
        assertThatThrownBy(() -> organizacaoService.ativar(criada.id()))
                .isInstanceOf(OrganizacaoService.OrganizacaoJaAtivaException.class);
    }
}
