package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarAtributoEntidadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.CriarEntidadeDadosRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.AtributoEntidadeRepository;
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
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private StatusProjetoRepository statusProjetoRepository;
    @Autowired private OrganizacaoRepository organizacaoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EntityManager entityManager;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Jwt jwtMock;
    private UUID entidadeId;

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
        Projeto projeto = projetoRepository.save(Projeto.builder()
                .nome("Projeto Attr").organizacao(org).status(sp).criadoPor(usuario).ativo(true)
                .dataCriacao(Instant.now()).dataAtualizacao(Instant.now()).build());
        entityManager.flush();

        entidadeId = entidadeDadosService.criar(jwtMock, projeto.getId(),
                new CriarEntidadeDadosRequestDTO("Cliente", null)).id();
    }

    @Test
    void criar_devePersistirAtributo() {
        var dto = new CriarAtributoEntidadeRequestDTO("cpf", "VARCHAR(11)", true, 1);

        var resultado = atributoEntidadeService.criar(jwtMock, entidadeId, dto);

        assertThat(resultado.id()).isNotNull();
        assertThat(resultado.nome()).isEqualTo("cpf");
        assertThat(resultado.obrigatorio()).isTrue();
        entityManager.flush();
        entityManager.clear();
        assertThat(atributoEntidadeRepository.findById(resultado.id())).isPresent();
    }

    @Test
    void criar_deveLancarException_quandoNomeDuplicado() {
        atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO("email", "TEXT", false, 1));

        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, entidadeId,
                new CriarAtributoEntidadeRequestDTO("EMAIL", "TEXT", false, 2)))
                .isInstanceOf(AtributoEntidadeService.AtributoEntidadeNomeJaExisteException.class);
    }

    @Test
    void criar_deveLancarException_quandoEntidadeNaoEncontrada() {
        assertThatThrownBy(() -> atributoEntidadeService.criar(jwtMock, UUID.randomUUID(),
                new CriarAtributoEntidadeRequestDTO("x", "TEXT", false, 1)))
                .isInstanceOf(EntidadeDadosService.EntidadeDadosNaoEncontradaException.class);
    }

    @Test
    void listarPorEntidade_deveOrdenarPorOrdem() {
        atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO("b", "TEXT", false, 2));
        atributoEntidadeService.criar(jwtMock, entidadeId, new CriarAtributoEntidadeRequestDTO("a", "TEXT", false, 1));

        var lista = atributoEntidadeService.listarPorEntidade(entidadeId);

        assertThat(lista).extracting(AtributoEntidadeResponseDTO::nome).containsExactly("a", "b");
    }

    @Test
    void deletar_deveRemoverAtributo() {
        var criado = atributoEntidadeService.criar(jwtMock, entidadeId,
                new CriarAtributoEntidadeRequestDTO("tmp", "TEXT", false, 1));

        atributoEntidadeService.deletar(jwtMock, criado.id());

        entityManager.flush();
        entityManager.clear();
        assertThat(atributoEntidadeRepository.findById(criado.id())).isEmpty();
    }
}
