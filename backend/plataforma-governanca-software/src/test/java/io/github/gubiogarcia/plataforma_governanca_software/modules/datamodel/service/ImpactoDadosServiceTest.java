package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoOperacaoImpacto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
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
class ImpactoDadosServiceTest {

    @Autowired private ImpactoDadosService impactoDadosService;
    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private AtributoEntidadeService atributoEntidadeService;
    @Autowired private ImpactoDadosRepository impactoDadosRepository;
    @Autowired private RequisitoRepository requisitoRepository;
    @Autowired private StatusRequisitoRepository statusRequisitoRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private Projeto projeto;
    private StatusRequisito statusRascunho;
    private UUID clienteId;
    private UUID cpfId;
    private UUID requisitoId;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Impacto Teste").email("impacto@dm-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        statusRascunho = statusRequisitoRepository.save(StatusRequisito.builder()
                .nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Impacto").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Impacto").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        Requisito requisito = requisitoRepository.save(novoRequisito(usuario, "REQ-001", "Cadastro de cliente"));
        requisitoId = requisito.getId();
        entityManager.flush();

        clienteId = entidadeDadosService.criar(jwtMock, projeto.getId(), new CriarEntidadeDadosRequestDTO("Cliente", null)).id();
        cpfId = atributoEntidadeService.criar(jwtMock, clienteId,
                new CriarAtributoEntidadeRequestDTO("cpf", "VARCHAR(11)", true, 1)).id();
    }

    private Requisito novoRequisito(Usuario usuario, String codigo, String titulo) {
        return Requisito.builder()
                .projeto(projeto).codigo(codigo).titulo(titulo).descricao("desc")
                .tipoRequisito(TipoRequisito.FUNCIONAL).status(statusRascunho).versao(1)
                .criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now())
                .build();
    }

    @Test
    void criar_devePersistirImpactoComAtributo() {
        var dto = new CriarImpactoDadosRequestDTO(clienteId, cpfId, TipoOperacaoImpacto.CRIA_ATRIBUTO, null, "cpf VARCHAR(11)");

        var resultado = impactoDadosService.criar(jwtMock, requisitoId, dto);

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.entidadeNome()).isEqualTo("Cliente");
        assertThat(resultado.atributoNome()).isEqualTo("cpf");
        assertThat(resultado.tipoOperacao()).isEqualTo(TipoOperacaoImpacto.CRIA_ATRIBUTO);
        entityManager.flush();
        entityManager.clear();
        assertThat(impactoDadosRepository.findById(resultado.id())).isPresent();
    }

    @Test
    void criar_deveLancarException_quandoAtributoNaoPertenceAEntidade() {
        var outraEntidade = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Pedido", null)).id();

        assertThatThrownBy(() -> impactoDadosService.criar(jwtMock, requisitoId,
                new CriarImpactoDadosRequestDTO(outraEntidade, cpfId, TipoOperacaoImpacto.ALTERA_ATRIBUTO, null, null)))
                .isInstanceOf(ImpactoDadosService.AtributoNaoPertenceAEntidadeException.class);
    }

    @Test
    void criar_deveLancarException_quandoRequisitoNaoEncontrado() {
        assertThatThrownBy(() -> impactoDadosService.criar(jwtMock, UUID.randomUUID(),
                new CriarImpactoDadosRequestDTO(clienteId, null, TipoOperacaoImpacto.ALTERA_ENTIDADE, null, null)))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }

    @Test
    void listarPorRequisitoAgrupado_deveAgruparPorEntidade() {
        impactoDadosService.criar(jwtMock, requisitoId,
                new CriarImpactoDadosRequestDTO(clienteId, cpfId, TipoOperacaoImpacto.CRIA_ATRIBUTO, null, "cpf"));
        impactoDadosService.criar(jwtMock, requisitoId,
                new CriarImpactoDadosRequestDTO(clienteId, null, TipoOperacaoImpacto.ALTERA_ENTIDADE, "v1", "v2"));

        var agrupado = impactoDadosService.listarPorRequisitoAgrupado(requisitoId);

        assertThat(agrupado).hasSize(1);
        assertThat(agrupado.get(0).entidadeNome()).isEqualTo("Cliente");
        assertThat(agrupado.get(0).alteracoes()).hasSize(2);
    }

    @Test
    void deletarEntidade_deveLancarException_quandoImpactada() {
        impactoDadosService.criar(jwtMock, requisitoId,
                new CriarImpactoDadosRequestDTO(clienteId, null, TipoOperacaoImpacto.ALTERA_ENTIDADE, null, null));

        assertThatThrownBy(() -> entidadeDadosService.deletar(jwtMock, clienteId))
                .isInstanceOf(EntidadeDadosService.EntidadeDadosEmUsoException.class);
    }
}
