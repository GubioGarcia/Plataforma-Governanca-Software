package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarRelacionamentoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.RelacionamentoEntidadeRepository;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class RelacionamentoEntidadeServiceTest {

    @Autowired private RelacionamentoEntidadeService relacionamentoEntidadeService;
    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private AtributoEntidadeService atributoEntidadeService;
    @Autowired private RelacionamentoEntidadeRepository relacionamentoEntidadeRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private UUID clienteId;
    private UUID pedidoId;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Rel Teste").email("rel@dm-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Rel").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        Projeto projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Rel").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        entityManager.flush();

        clienteId = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Cliente", null)).id();
        pedidoId = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Pedido", null)).id();
    }

    @Test
    void criar_devePersistirRelacionamento() {
        var dto = new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, null);

        var resultado = relacionamentoEntidadeService.criar(jwtMock, dto);

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.entidadeOrigemNome()).isEqualTo("Pedido");
        assertThat(resultado.entidadeDestinoNome()).isEqualTo("Cliente");
        assertThat(resultado.atributoFkId()).isNull();
        entityManager.flush();
        entityManager.clear();
        assertThat(relacionamentoEntidadeRepository.findById(resultado.id())).isPresent();
    }

    @Test
    void criar_comAtributoFk_devePreencherAtributoFkNaResposta() {
        UUID atributoId = atributoEntidadeService.criar(jwtMock, pedidoId,
                new CriarAtributoEntidadeRequestDTO("cliente_id", "UUID", true, false, 1, false, null, null)).id();

        var resultado = relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, atributoId));

        assertThat(resultado.atributoFkId()).isEqualTo(atributoId);
        assertThat(resultado.atributoFkNome()).isEqualTo("cliente_id");
    }

    @Test
    void criar_deveLancarException_quandoAtributoFkJaVinculado() {
        UUID atributoId = atributoEntidadeService.criar(jwtMock, pedidoId,
                new CriarAtributoEntidadeRequestDTO("cliente_id", "UUID", true, false, 1, false, null, null)).id();
        relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_UM, atributoId));

        assertThatThrownBy(() -> relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, atributoId)))
                .isInstanceOf(RelacionamentoEntidadeService.AtributoFkJaVinculadoException.class);
    }

    @Test
    void criar_deveLancarException_quandoReflexivo() {
        assertThatThrownBy(() -> relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(clienteId, clienteId, TipoRelacionamentoEntidade.UM_PARA_UM, null)))
                .isInstanceOf(RelacionamentoEntidadeService.RelacionamentoEntidadeReflexivoException.class);
    }

    @Test
    void criar_deveLancarException_quandoProjetoDiferente() {
        Usuario usuario = usuarioRepository.findByExternalIdentityId(UUID.fromString(jwtMock.getSubject())).orElseThrow();
        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Rel Outro").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        Projeto outroProjeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Rel Outro").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        entityManager.flush();
        UUID entidadeOutroProjetoId = entidadeDadosService.criar(jwtMock, outroProjeto.getId(),
                new CriarEntidadeDadosRequestDTO("Externa", null)).id();

        assertThatThrownBy(() -> relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, entidadeOutroProjetoId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, null)))
                .isInstanceOf(RelacionamentoEntidadeService.EntidadesDeProjetosDiferentesException.class);
    }

    @Test
    void criar_devePermitirDuasFksParaAMesmaEntidadeDestinoComOMesmoTipo() {
        // Constraint UNIQUE(origem, destino, tipo) foi removida: cada FK vira uma
        // linha independente, identificada por atributo_fk_id (nulo aqui, manual).
        relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, null));

        var segundo = relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, null));

        assertThat(segundo.id()).isNotNull();
        assertThat(relacionamentoEntidadeService.listarPorEntidade(clienteId)).hasSize(2);
    }

    @Test
    void listarPorProjeto_deveRetornarTodos() {
        relacionamentoEntidadeService.criar(jwtMock,
                new CriarRelacionamentoEntidadeRequestDTO(pedidoId, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS, null));

        var lista = relacionamentoEntidadeService.listarPorEntidade(clienteId);

        assertThat(lista).hasSize(1);
    }
}
