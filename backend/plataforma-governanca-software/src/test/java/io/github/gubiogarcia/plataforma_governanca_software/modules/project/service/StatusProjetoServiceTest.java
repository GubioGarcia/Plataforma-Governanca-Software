package io.github.gubiogarcia.plataforma_governanca_software.modules.project.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Testes de integração para StatusProjetoService.
 *
 * Estratégia:
 *  - @SpringBootTest(webEnvironment=NONE): carrega o contexto completo sem servidor web.
 *  - @ActiveProfiles("test"): usa H2 em memória (application-test.properties).
 *  - @Transactional: rollback automático após cada teste — banco limpo sem @AfterEach.
 *  - entityManager.flush/clear: garante que a verificação vai ao banco, não ao cache JPA.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class StatusProjetoServiceTest {

    @Autowired private StatusProjetoService statusProjetoService;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private EntityManager entityManager;

    // Substitui o JwtDecoder que tenta conectar ao Keycloak na inicialização
    @MockitoBean
    private JwtDecoder jwtDecoder;

    // ─── criar ───────────────────────────────────────────────────────────────

    @Test
    void criar_deveInserirStatusNoBanco_quandoDadosValidos() {
        // Given
        var request = new CriarStatusProjetoRequestDTO("EM_ESPERA", "Aguardando aprovação externa", 50);

        // When
        var resultado = statusProjetoService.criar(request);

        // Then — verifica o DTO retornado
        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("EM_ESPERA");
        assertThat(resultado.descricao()).isEqualTo("Aguardando aprovação externa");
        assertThat(resultado.ordem()).isEqualTo(50);

        // Then — verifica o registro persistido no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = statusProjetoRepository.findById(resultado.id());
        assertThat(salvo).isPresent();
        assertThat(salvo.get().getNome()).isEqualTo("EM_ESPERA");
        assertThat(salvo.get().getDescricao()).isEqualTo("Aguardando aprovação externa");
        assertThat(salvo.get().getOrdem()).isEqualTo(50);
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicado() {
        // Given
        statusProjetoService.criar(new CriarStatusProjetoRequestDTO("PENDENTE", "Desc", 10));

        // When / Then — nome idêntico (case-insensitive) deve ser rejeitado
        assertThatThrownBy(() ->
                statusProjetoService.criar(new CriarStatusProjetoRequestDTO("pendente", "Outra desc", 11))
        ).isInstanceOf(StatusProjetoService.StatusProjetoNomeJaExisteException.class);
    }

    @Test
    void criar_deveLancarException_quandoOrdemDuplicada() {
        // Given
        statusProjetoService.criar(new CriarStatusProjetoRequestDTO("STATUS_A", "Desc A", 25));

        // When / Then — mesma ordem deve ser rejeitada
        assertThatThrownBy(() ->
                statusProjetoService.criar(new CriarStatusProjetoRequestDTO("STATUS_B", "Desc B", 25))
        ).isInstanceOf(StatusProjetoService.StatusProjetoOrdemJaExisteException.class);
    }

    // ─── listar ──────────────────────────────────────────────────────────────

    @Test
    void listar_deveRetornarListaOrdenadaCrescentementePorOrdem() {
        // Given — inseridos fora de ordem
        statusProjetoService.criar(new CriarStatusProjetoRequestDTO("TERCEIRO", "Terceiro", 30));
        statusProjetoService.criar(new CriarStatusProjetoRequestDTO("PRIMEIRO", "Primeiro", 10));
        statusProjetoService.criar(new CriarStatusProjetoRequestDTO("SEGUNDO", "Segundo", 20));

        // When
        var lista = statusProjetoService.listar();

        // Then — lista não vazia e em ordem crescente
        assertThat(lista).isNotEmpty();
        for (int i = 0; i < lista.size() - 1; i++) {
            assertThat(lista.get(i).ordem())
                    .as("Posição %d deve ter ordem <= posição %d", i, i + 1)
                    .isLessThanOrEqualTo(lista.get(i + 1).ordem());
        }
    }

    // ─── buscarPorId ─────────────────────────────────────────────────────────

    @Test
    void buscarPorId_deveRetornarStatusExistente() {
        // Given
        var criado = statusProjetoService.criar(new CriarStatusProjetoRequestDTO("PARA_BUSCA", "Desc busca", 40));

        // When
        var encontrado = statusProjetoService.buscarPorId(criado.id());

        // Then
        assertThat(encontrado.id()).isEqualTo(criado.id());
        assertThat(encontrado.nome()).isEqualTo("PARA_BUSCA");
        assertThat(encontrado.ordem()).isEqualTo(40);
    }

    @Test
    void buscarPorId_deveLancarException_quandoNaoEncontrado() {
        assertThatThrownBy(() -> statusProjetoService.buscarPorId(UUID.randomUUID()))
                .isInstanceOf(StatusProjetoService.StatusProjetoNaoEncontradoException.class);
    }

    // ─── atualizar ───────────────────────────────────────────────────────────

    @Test
    void atualizar_deveAtualizarRegistroNoBanco_quandoDadosValidos() {
        // Given
        var criado = statusProjetoService.criar(new CriarStatusProjetoRequestDTO("NOME_ORIGINAL", "Desc original", 60));
        var request = new AtualizarStatusProjetoRequestDTO("NOME_ATUALIZADO", "Nova descrição", 60);

        // When
        var resultado = statusProjetoService.atualizar(criado.id(), request);

        // Then — verifica o DTO retornado
        assertThat(resultado.nome()).isEqualTo("NOME_ATUALIZADO");

        // Then — verifica a atualização persistida no banco
        entityManager.flush();
        entityManager.clear();

        var salvo = statusProjetoRepository.findById(criado.id()).orElseThrow();
        assertThat(salvo.getNome()).isEqualTo("NOME_ATUALIZADO");
        assertThat(salvo.getDescricao()).isEqualTo("Nova descrição");
    }

    // ─── deletar ─────────────────────────────────────────────────────────────

    @Test
    void deletar_deveRemoverRegistroDoBanco() {
        // Given
        var criado = statusProjetoService.criar(new CriarStatusProjetoRequestDTO("PARA_DELETAR", "Desc", 70));
        var id = criado.id();

        // When
        statusProjetoService.deletar(id);

        // Then — registro não deve mais existir no banco
        entityManager.flush();
        entityManager.clear();

        assertThat(statusProjetoRepository.findById(id)).isEmpty();
    }

    @Test
    void deletar_deveLancarException_quandoNaoEncontrado() {
        assertThatThrownBy(() -> statusProjetoService.deletar(UUID.randomUUID()))
                .isInstanceOf(StatusProjetoService.StatusProjetoNaoEncontradoException.class);
    }

    @Test
    void deletar_deveLancarException_quandoStatusVinculadoAProjeto() {
        // Given — status criado e vinculado a um projeto
        var statusDTO = statusProjetoService.criar(new CriarStatusProjetoRequestDTO("EM_USO", "Em uso", 80));
        StatusProjeto status = statusProjetoRepository.findById(statusDTO.id()).orElseThrow();

        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Para Teste Delete Status")
                .ativo(true)
                .criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        projetoRepository.save(Projeto.builder()
                .nome("Projeto Vinculado ao Status")
                .status(status)
                .organizacao(org)
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        entityManager.flush();

        // When / Then — não deve permitir deletar um status em uso
        assertThatThrownBy(() -> statusProjetoService.deletar(status.getId()))
                .isInstanceOf(StatusProjetoService.StatusProjetoEmUsoException.class);
    }
}
