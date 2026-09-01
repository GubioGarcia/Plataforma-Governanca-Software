package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoOperacaoImpacto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarImpactoDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.EntidadeDadosService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.ImpactoDadosService;
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
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoRelacaoMatriz;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.AnaliseImpactoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.MatrizRastreabilidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.RequisitoImpactadoDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CriarVinculoRequisitoRequestDTO;
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
 * Testes de integração para a matriz de rastreabilidade e a análise de impacto
 * (BFS sobre vínculos diretos + indiretos).
 *
 * Grafo montado:
 *   REQ-001 --DIRETO(IMPACTA)--> REQ-002
 *   REQ-002 e REQ-003 impactam a mesma entidade "Cliente" (INDIRETO)
 *   REQ-004 isolado
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class MatrizRastreabilidadeServiceTest {

    @Autowired private MatrizRastreabilidadeService matrizRastreabilidadeService;
    @Autowired private VinculoRequisitoService vinculoRequisitoService;
    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private ImpactoDadosService impactoDadosService;
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
    private StatusRequisito status;
    private Usuario usuario;
    private UUID reqA;
    private UUID reqB;
    private UUID reqC;
    private UUID reqD;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Matriz Teste").email("matriz@tr-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        status = statusRequisitoRepository.save(StatusRequisito.builder().nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Matriz").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Matriz").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        reqA = requisitoRepository.save(novoRequisito("REQ-001", "A")).getId();
        reqB = requisitoRepository.save(novoRequisito("REQ-002", "B")).getId();
        reqC = requisitoRepository.save(novoRequisito("REQ-003", "C")).getId();
        reqD = requisitoRepository.save(novoRequisito("REQ-004", "D")).getId();
        entityManager.flush();

        // Aresta direta A -> B
        vinculoRequisitoService.criar(jwtMock, reqA, new CriarVinculoRequisitoRequestDTO(reqB, TipoVinculoRequisito.IMPACTA));

        // Aresta indireta B <-> C via entidade "Cliente"
        UUID clienteId = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Cliente", null)).id();
        impactoDadosService.criar(jwtMock, reqB,
                new CriarImpactoDadosRequestDTO(clienteId, null, TipoOperacaoImpacto.ALTERA_ENTIDADE, null, null));
        impactoDadosService.criar(jwtMock, reqC,
                new CriarImpactoDadosRequestDTO(clienteId, null, TipoOperacaoImpacto.ALTERA_ENTIDADE, null, null));
        entityManager.flush();
    }

    private Requisito novoRequisito(String codigo, String titulo) {
        return Requisito.builder()
                .projeto(projeto).codigo(codigo).titulo(titulo).descricao("desc")
                .tipoRequisito(TipoRequisito.FUNCIONAL).status(status).versao(1)
                .criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now())
                .build();
    }

    @Test
    void montarMatriz_deveTerQuatroRequisitosNoEixoECelulasDiretasEIndiretas() {
        MatrizRastreabilidadeResponseDTO matriz = matrizRastreabilidadeService.montarMatriz(projeto.getId());

        assertThat(matriz.requisitos()).hasSize(4);

        boolean temDiretaAB = matriz.celulas().stream().anyMatch(c ->
                c.requisitoOrigemId().equals(reqA) && c.requisitoDestinoId().equals(reqB)
                        && c.tipoRelacao() == TipoRelacaoMatriz.DIRETO);
        boolean temIndiretaBC = matriz.celulas().stream().anyMatch(c ->
                c.requisitoOrigemId().equals(reqB) && c.requisitoDestinoId().equals(reqC)
                        && c.tipoRelacao() == TipoRelacaoMatriz.INDIRETO
                        && c.entidadesCompartilhadas().contains("Cliente"));

        assertThat(temDiretaAB).isTrue();
        assertThat(temIndiretaBC).isTrue();
    }

    @Test
    void analisarImpacto_apartirDeA_deveAlcancarBpor1saltoECpor2saltos() {
        AnaliseImpactoResponseDTO analise = matrizRastreabilidadeService.analisarImpacto(reqA);

        assertThat(analise.impactados()).extracting(RequisitoImpactadoDTO::codigo)
                .containsExactlyInAnyOrder("REQ-002", "REQ-003");

        RequisitoImpactadoDTO b = buscar(analise, "REQ-002");
        assertThat(b.distancia()).isEqualTo(1);
        assertThat(b.tipoRelacao()).isEqualTo(TipoRelacaoMatriz.DIRETO);

        RequisitoImpactadoDTO c = buscar(analise, "REQ-003");
        assertThat(c.distancia()).isEqualTo(2);
        assertThat(c.tipoRelacao()).isEqualTo(TipoRelacaoMatriz.MISTO);
        assertThat(c.caminho()).containsExactly("REQ-001", "REQ-002", "REQ-003");
    }

    @Test
    void analisarImpacto_naoDeveAlcancarRequisitoIsolado() {
        AnaliseImpactoResponseDTO analise = matrizRastreabilidadeService.analisarImpacto(reqA);

        assertThat(analise.impactados()).extracting(RequisitoImpactadoDTO::codigo).doesNotContain("REQ-004");
    }

    @Test
    void analisarImpacto_deveLancarException_quandoRequisitoNaoEncontrado() {
        assertThatThrownBy(() -> matrizRastreabilidadeService.analisarImpacto(UUID.randomUUID()))
                .isInstanceOf(RequisitoService.RequisitoNaoEncontradoException.class);
    }

    @Test
    void montarMatriz_deveLancarException_quandoProjetoNaoEncontrado() {
        assertThatThrownBy(() -> matrizRastreabilidadeService.montarMatriz(UUID.randomUUID()))
                .isInstanceOf(RequisitoService.ProjetoNaoEncontradoException.class);
    }

    private RequisitoImpactadoDTO buscar(AnaliseImpactoResponseDTO analise, String codigo) {
        return analise.impactados().stream()
                .filter(i -> i.codigo().equals(codigo))
                .findFirst().orElseThrow();
    }
}
