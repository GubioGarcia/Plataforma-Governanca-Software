package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service;

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
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CriarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository.VinculoRequisitoRepository;
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
class VinculoRequisitoServiceTest {

    @Autowired private VinculoRequisitoService vinculoRequisitoService;
    @Autowired private VinculoRequisitoRepository vinculoRequisitoRepository;
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
    private Projeto outroProjeto;
    private StatusRequisito status;
    private Usuario usuario;
    private UUID reqA;
    private UUID reqB;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Vinc Teste").email("vinc@tr-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        status = statusRequisitoRepository.save(StatusRequisito.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Vinc").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Vinc").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        outroProjeto = projetoRepository.save(Projeto.builder()
                .nome("Outro Projeto Vinc").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        reqA = requisitoRepository.save(novoRequisito(projeto, "REQ-001", "A")).getId();
        reqB = requisitoRepository.save(novoRequisito(projeto, "REQ-002", "B")).getId();
        entityManager.flush();
    }

    private Requisito novoRequisito(Projeto p, String codigo, String titulo) {
        return Requisito.builder()
                .projeto(p).codigo(codigo).titulo(titulo).descricao("desc")
                .tipoRequisito(TipoRequisito.FUNCIONAL).status(status).versao(1)
                .criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now())
                .build();
    }

    @Test
    void criar_devePersistirVinculoComSentidoSaida() {
        var resultado = vinculoRequisitoService.criar(jwtMock, reqA,
                new CriarVinculoRequisitoRequestDTO(reqB, TipoVinculoRequisito.IMPACTA));

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.requisitoOrigemCodigo()).isEqualTo("REQ-001");
        assertThat(resultado.requisitoDestinoCodigo()).isEqualTo("REQ-002");
        assertThat(resultado.sentido()).isEqualTo("SAIDA");
        entityManager.flush();
        entityManager.clear();
        assertThat(vinculoRequisitoRepository.findById(resultado.id())).isPresent();
    }

    @Test
    void criar_deveLancarException_quandoReflexivo() {
        assertThatThrownBy(() -> vinculoRequisitoService.criar(jwtMock, reqA,
                new CriarVinculoRequisitoRequestDTO(reqA, TipoVinculoRequisito.DEPENDE_DE)))
                .isInstanceOf(VinculoRequisitoService.VinculoRequisitoReflexivoException.class);
    }

    @Test
    void criar_deveLancarException_quandoDuplicado() {
        vinculoRequisitoService.criar(jwtMock, reqA, new CriarVinculoRequisitoRequestDTO(reqB, TipoVinculoRequisito.IMPACTA));

        assertThatThrownBy(() -> vinculoRequisitoService.criar(jwtMock, reqA,
                new CriarVinculoRequisitoRequestDTO(reqB, TipoVinculoRequisito.IMPACTA)))
                .isInstanceOf(VinculoRequisitoService.VinculoRequisitoDuplicadoException.class);
    }

    @Test
    void criar_deveLancarException_quandoRequisitosDeProjetosDiferentes() {
        UUID reqOutro = requisitoRepository.save(novoRequisito(outroProjeto, "REQ-101", "Outro")).getId();
        entityManager.flush();

        assertThatThrownBy(() -> vinculoRequisitoService.criar(jwtMock, reqA,
                new CriarVinculoRequisitoRequestDTO(reqOutro, TipoVinculoRequisito.DEPENDE_DE)))
                .isInstanceOf(VinculoRequisitoService.RequisitosDeProjetosDiferentesException.class);
    }

    @Test
    void listarPorRequisito_deveMarcarEntradaParaODestino() {
        vinculoRequisitoService.criar(jwtMock, reqA, new CriarVinculoRequisitoRequestDTO(reqB, TipoVinculoRequisito.IMPACTA));

        var lista = vinculoRequisitoService.listarPorRequisito(reqB);

        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).sentido()).isEqualTo("ENTRADA");
    }

    @Test
    void listarPorRequisito_deveLancarException_quandoRequisitoNaoEncontrado() {
        assertThatThrownBy(() -> vinculoRequisitoService.listarPorRequisito(UUID.randomUUID()))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }
}
