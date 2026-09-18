package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtualizarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
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
class AtributoEntidadeServiceTest {

    @Autowired private AtributoEntidadeService atributoEntidadeService;
    @Autowired private EntidadeDadosService entidadeDadosService;
    @Autowired private AtributoEntidadeRepository atributoEntidadeRepository;
    @Autowired private RelacionamentoEntidadeRepository relacionamentoEntidadeRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private Projeto projeto;
    private UUID entidadeId;
    private UUID clienteId;

    @BeforeEach
    void setUp() {
        UUID keycloakId = UUID.randomUUID();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .externalIdentityId(keycloakId).nome("Attr Teste").email("attr@dm-teste.com")
                .ativo(true).dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());

        jwtMock = mock(Jwt.class);
        when(jwtMock.getSubject()).thenReturn(keycloakId.toString());

        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Attr").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Attr").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        entityManager.flush();

        entidadeId = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Pedido", null)).id();
        clienteId = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Cliente", null)).id();
    }

    private CriarAtributoEntidadeRequestDTO dtoSimples(String nome, String tipo, boolean obrigatorio, int ordem) {
        return new CriarAtributoEntidadeRequestDTO(nome, tipo, obrigatorio, false, ordem, false, null, null);
    }

    /** Uma entidade em um projeto (e organização) diferentes de {@link #projeto}, para os testes de validação cross-project. */
    private UUID criarEntidadeEmOutroProjeto() {
        Usuario usuario = usuarioRepository.findByExternalIdentityId(UUID.fromString(jwtMock.getSubject())).orElseThrow();
        StatusProjeto sp = statusProjetoRepository.save(StatusProjeto.builder()
                .nome("RASCUNHO").descricao("x").ordem(1).build());
        Organizacao org = organizacaoRepository.save(Organizacao.builder()
                .nome("Org Attr Outro").ativo(true).criadoPor(UUID.randomUUID())
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        Projeto outroProjeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Attr Outro").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        entityManager.flush();

        return entidadeDadosService.criar(jwtMock, outroProjeto.getId(),
                new CriarEntidadeDadosRequestDTO("Externa", null)).id();
    }

    @Test
    void criar_devePersistirAtributo() {
        var resultado = atributoEntidadeService.criar(jwtMock, entidadeId, dtoSimples("cpf", "VARCHAR(11)", true, 1));

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("cpf");
        assertThat(resultado.obrigatorio()).isTrue();
        assertThat(resultado.chaveEstrangeira()).isFalse();
        entityManager.flush();
        entityManager.clear();
        assertThat(atributoEntidadeRepository.findById(resultado.id())).isPresent();
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicado() {
        atributoEntidadeService.criar(jwtMock, entidadeId, dtoSimples("email", "TEXT", false, 1));

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId,
                dtoSimples("EMAIL", "TEXT", false, 2)))
                .isInstanceOf(AtributoEntidadeService.AtributoEntidadeNomeJaExisteException.class);
    }

    @Test
    void criar_deveLancarException_quandoEntidadeNaoEncontrada() {
        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, UUID.randomUUID(),
                dtoSimples("x", "TEXT", false, 1)))
                .isInstanceOf(EntidadeDadosService.EntidadeDadosNaoEncontradaException.class);
    }

    @Test
    void listarPorEntidade_deveOrdenarPorOrdem() {
        atributoEntidadeService.criar(jwtMock, entidadeId, dtoSimples("b", "TEXT", false, 2));
        atributoEntidadeService.criar(jwtMock, entidadeId, dtoSimples("a", "TEXT", false, 1));

        var lista = atributoEntidadeService.listarPorEntidade(entidadeId);

        assertThat(lista).extracting(AtributoEntidadeResponseDTO::nome).containsExactly("a", "b");
    }

    @Test
    void deletar_deveRemoverAtributo() {
        var criado = atributoEntidadeService.criar(jwtMock, entidadeId, dtoSimples("tmp", "TEXT", false, 1));

        atributoEntidadeService.deletar(jwtMock, criado.id());

        entityManager.flush();
        entityManager.clear();
        assertThat(atributoEntidadeRepository.findById(criado.id())).isEmpty();
    }

    // ── Chave estrangeira: relacionamento derivado ──────────────────────────────

    @Test
    void criar_comChaveEstrangeira_deveDerivarRelacionamento() {
        var dto = new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS);

        var resultado = atributoEntidadeService.criar(jwtMock, entidadeId, dto);

        assertThat(resultado.chaveEstrangeira()).isTrue();
        assertThat(resultado.entidadeReferenciadaId()).isEqualTo(clienteId);
        assertThat(resultado.relacionamentoId()).isNotNull();
        assertThat(resultado.tipoRelacionamento()).isEqualTo(TipoRelacionamentoEntidade.UM_PARA_MUITOS);

        entityManager.flush();
        entityManager.clear();
        var relacionamento = relacionamentoEntidadeRepository.findByAtributoFkId(resultado.id()).orElseThrow();
        assertThat(relacionamento.getEntidadeOrigem().getId()).isEqualTo(entidadeId);
        assertThat(relacionamento.getEntidadeDestino().getId()).isEqualTo(clienteId);
    }

    @Test
    void criar_comChaveEstrangeiraSemTipo_deveUsarUmParaMuitosComoDefault() {
        var dto = new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, clienteId, null);

        var resultado = atributoEntidadeService.criar(jwtMock, entidadeId, dto);

        assertThat(resultado.tipoRelacionamento()).isEqualTo(TipoRelacionamentoEntidade.UM_PARA_MUITOS);
    }

    @Test
    void criar_comChaveEstrangeira_deveLancarException_quandoEntidadeReferenciadaAusente() {
        var dto = new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, null, null);

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId, dto))
                .isInstanceOf(AtributoEntidadeService.EntidadeReferenciadaObrigatoriaException.class);
    }

    @Test
    void criar_comChaveEstrangeira_deveLancarException_quandoReflexiva() {
        var dto = new CriarAtributoEntidadeRequestDTO(
                "auto_id", "UUID", true, false, 1, true, entidadeId, null);

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId, dto))
                .isInstanceOf(RelacionamentoEntidadeService.RelacionamentoEntidadeReflexivoException.class);
    }

    @Test
    void criar_comChaveEstrangeira_deveLancarException_quandoEntidadeReferenciadaNaoEncontrada() {
        var dto = new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, UUID.randomUUID(), null);

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId, dto))
                .isInstanceOf(EntidadeDadosService.EntidadeDadosNaoEncontradaException.class);
    }

    @Test
    void criar_comChaveEstrangeira_deveLancarException_quandoProjetoDiferente() {
        UUID entidadeOutroProjetoId = criarEntidadeEmOutroProjeto();

        var dto = new CriarAtributoEntidadeRequestDTO(
                "externo_id", "UUID", true, false, 1, true, entidadeOutroProjetoId, null);

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId, dto))
                .isInstanceOf(RelacionamentoEntidadeService.EntidadesDeProjetosDiferentesException.class);
    }

    @Test
    void atualizar_desmarcandoChaveEstrangeira_deveRemoverRelacionamentoDerivado() {
        var criado = atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS));

        atributoEntidadeService.atualizar(jwtMock, criado.id(),
                new AtualizarAtributoEntidadeRequestDTO(null, null, null, null, null, false, null, null));

        entityManager.flush();
        entityManager.clear();
        assertThat(relacionamentoEntidadeRepository.findByAtributoFkId(criado.id())).isEmpty();
        assertThat(atributoEntidadeRepository.findById(criado.id()).orElseThrow().getChaveEstrangeira()).isFalse();
    }

    @Test
    void atualizar_trocandoEntidadeReferenciada_deveAtualizarRelacionamentoDerivado() {
        UUID vendedorId = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Vendedor", null)).id();

        var criado = atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS));

        var atualizado = atributoEntidadeService.atualizar(jwtMock, criado.id(),
                new AtualizarAtributoEntidadeRequestDTO(null, null, null, null, null, true, vendedorId, null));

        assertThat(atualizado.entidadeReferenciadaId()).isEqualTo(vendedorId);
        entityManager.flush();
        entityManager.clear();
        var relacionamento = relacionamentoEntidadeRepository.findByAtributoFkId(criado.id()).orElseThrow();
        assertThat(relacionamento.getEntidadeDestino().getId()).isEqualTo(vendedorId);
    }

    @Test
    void deletar_comChaveEstrangeira_deveRemoverRelacionamentoDerivado() {
        var criado = atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO(
                "cliente_id", "UUID", true, false, 1, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS));

        atributoEntidadeService.deletar(jwtMock, criado.id());

        entityManager.flush();
        entityManager.clear();
        assertThat(relacionamentoEntidadeRepository.findByAtributoFkId(criado.id())).isEmpty();
    }

    @Test
    void criar_deveAceitarDuasFksDaMesmaEntidadeParaOMesmoDestino() {
        // Ex.: Transferencia.conta_origem_id e Transferencia.conta_destino_id -> Conta.
        var primeira = atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO(
                "cliente_faturamento_id", "UUID", true, false, 1, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS));
        var segunda = atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO(
                "cliente_entrega_id", "UUID", true, false, 2, true, clienteId, TipoRelacionamentoEntidade.UM_PARA_MUITOS));

        assertThat(primeira.relacionamentoId()).isNotEqualTo(segunda.relacionamentoId());
    }
}
