package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.EntidadeDadosResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.EntidadeDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Testes de integração para EntidadeDadosService (módulo datamodel).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class EntidadeDadosServiceTest {

    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private RelacionamentoEntidadeService relacionamentoEntidadeService;
    @Autowired private EntidadeDadosRepository entidadeDadosRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private Projeto projeto;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId)
                .nome("Modelador Teste")
                .email("modelador@dm-teste.com")
                .ativo(true)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto statusProjeto = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("RASCUNHO").descricao("Em elaboração").ordem(1).build());

        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org DataModel").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto DataModel").organizacao(org).status(statusProjeto)
                .criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        entityManager.flush();
    }

    @Test
    void criar_devePersistirEntidadeAtivaComAuditoria() {
        var dto = new CriarEntidadeDadosRequestDTO("Cliente", "Cliente do e-commerce");

        var resultado = entidadeDadosService.criar(jwtMock, projeto.getId(), dto);

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("Cliente");
        assertThat(resultado.ativo()).isTrue();
        assertThat(resultado.qtdAtributos()).isZero();

        entityManager.flush();
        entityManager.clear();
        var salvo = entidadeDadosRepository.findById(resultado.id()).orElseThrow();
        assertThat(salvo.getProjeto().getId()).isEqualTo(projeto.getId());
        assertThat(salvo.getCriadoPor()).isNotNull();
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicadoNoProjeto() {
        entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Pedido", null));

        assertThatThrownBy(() -> entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("pedido", null)))
                .isInstanceOf(EntidadeDadosService.EntidadeDadosNomeJaExisteException.class);
    }

    @Test
    void criar_deveLancarException_quandoProjetoNaoEncontrado() {
        assertThatThrownBy(() -> entidadeDadosService.criar(jwtMock, UUID.randomUUID(),
                new CriarEntidadeDadosRequestDTO("X", null)))
                .isInstanceOf(EntidadeDadosService.ProjetoNaoEncontradoException.class);
    }

    @Test
    void listarPorProjeto_deveRetornarSomenteAtivas() {
        var a = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Ativa", null));
        var b = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Inativa", null));
        entidadeDadosService.deletar(jwtMock, b.id());

        var lista = entidadeDadosService.listarPorProjeto(projeto.getId());

        assertThat(lista).extracting(EntidadeDadosResponseDTO::nome).contains("Ativa").doesNotContain("Inativa");
    }

    @Test
    void atualizar_deveTrocarNome() {
        var criada = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Nome Antigo", null));

        var atualizada = entidadeDadosService.atualizar(jwtMock, criada.id(),
                new AtualizarEntidadeDadosRequestDTO("Nome Novo", "Nova descrição"));

        assertThat(atualizada.nome()).isEqualTo("Nome Novo");
        entityManager.flush();
        entityManager.clear();
        assertThat(entidadeDadosRepository.findById(criada.id()).orElseThrow().getNome()).isEqualTo("Nome Novo");
    }

    @Test
    void deletar_deveFazerSoftDelete() {
        var criada = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Some", null));

        entidadeDadosService.deletar(jwtMock, criada.id());

        entityManager.flush();
        entityManager.clear();
        assertThat(entidadeDadosRepository.findById(criada.id()).orElseThrow().getAtivo()).isFalse();
    }

    @Test
    void montarDiagrama_deveIncluirEntidadesERelacionamentos() {
        var cliente = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Cliente", null));
        var pedido = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Pedido", null));
        relacionamentoEntidadeService.criar(jwtMock, new CriarRelacionamentoEntidadeRequestDTO(
                pedido.id(), cliente.id(), TipoRelacionamentoEntidade.UM_PARA_MUITOS));

        var diagrama = entidadeDadosService.montarDiagrama(projeto.getId(), cliente.id());

        assertThat(diagrama.entidades()).hasSize(2);
        assertThat(diagrama.relacionamentos()).hasSize(1);
        assertThat(diagrama.entidadeDestacadaId()).isEqualTo(cliente.id());
    }
}
