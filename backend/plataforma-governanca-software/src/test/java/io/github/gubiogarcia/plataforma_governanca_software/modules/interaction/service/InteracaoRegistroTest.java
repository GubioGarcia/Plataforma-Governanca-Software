package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.AtualizarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto.CriarComentarioRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.service.ComentarioService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.repository.InteracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.AtualizarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CriarVinculoRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service.VinculoRequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Cada ação de usuário vira uma interação com o módulo e o tipo certos — é a base
 * dos contadores de Stakeholders, Analytics e Visão geral.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class InteracaoRegistroTest {

    @Autowired private RequisitoService requisitoService;
    @Autowired private ComentarioService comentarioService;
    @Autowired private VinculoRequisitoService vinculoService;
    @Autowired private InteracaoService interacaoService;
    @Autowired private InteracaoRepository interacaoRepository;
    @Autowired private CenarioProjetoTeste cenario;
    @Autowired private EntityManager em;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario dono;
    private Projeto projeto;
    private Requisito requisito;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        dono = cenario.usuario("dono.interacao@x.com");
        Organizacao org = cenario.organizacao("Org Interação", dono);
        projeto = cenario.projeto("Proj Interação", org, dono);
        cenario.statusDeRequisito();
        requisito = cenario.requisito(projeto, dono, "RASCUNHO");
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(dono.getExternalIdentityId().toString());
        AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), grupoOrg(org, "_dono"));
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    /** Interações do projeto como "MODULO/TIPO". */
    private List<String> registradas() {
        return interacaoRepository.findAllByProjetoId(projeto.getId()).stream()
                .map(i -> i.getModulo() + "/" + i.getTipo())
                .toList();
    }

    @Test
    void comentario_criarEditarExcluir_registramNoModuloComentario() {
        var c = comentarioService.criar(jwt, new CriarComentarioRequestDTO("oi", "REQUISITO", requisito.getId(), null, null));

        comentarioService.editar(jwt, c.id(), new AtualizarComentarioRequestDTO("oi, editado"));
        // Como em outra requisição: a data de criação relida do banco (precisão de microssegundos)
        em.flush();
        em.clear();
        comentarioService.deletar(jwt, c.id());

        assertThat(registradas()).containsExactlyInAnyOrder("COMENTARIO/COMENTARIO", "COMENTARIO/EDICAO", "COMENTARIO/EXCLUSAO");
    }

    @Test
    void aprovarEReprovar_registramAprovacaoEReprovacao() {
        requisitoService.aprovar(jwt, requisito.getId());
        requisitoService.reprovar(jwt, requisito.getId());

        assertThat(registradas()).containsExactlyInAnyOrder("REQUISITO/APROVACAO", "REQUISITO/REPROVACAO");
    }

    @Test
    void atualizar_comMudancaDeStatus_registraMudancaStatus_semMudanca_registraEdicao() {
        var emRevisao = cenario.statusRequisito("EM_REVISAO", 2);
        requisitoService.atualizar(jwt, requisito.getId(), new AtualizarRequisitoRequestDTO(null, null, null, emRevisao.getId(), null));
        requisitoService.atualizar(jwt, requisito.getId(), new AtualizarRequisitoRequestDTO("Novo título", null, null, null, null));

        assertThat(registradas()).containsExactlyInAnyOrder("REQUISITO/MUDANCA_STATUS", "REQUISITO/EDICAO");
    }

    @Test
    void vinculo_editarERemover_registramNaRastreabilidade() {
        Requisito destino = cenario.requisito(projeto, dono, "RASCUNHO");
        var v = vinculoService.criar(jwt, requisito.getId(), new CriarVinculoRequisitoRequestDTO(destino.getId(), TipoVinculoRequisito.DEPENDE_DE));

        vinculoService.atualizar(jwt, v.id(), new AtualizarVinculoRequisitoRequestDTO(TipoVinculoRequisito.IMPACTA));
        vinculoService.deletar(jwt, v.id());

        assertThat(registradas()).containsExactlyInAnyOrder(
                "RASTREABILIDADE/CRIACAO", "RASTREABILIDADE/EDICAO", "RASTREABILIDADE/EXCLUSAO");
    }

    @Test
    void resumo_totalDoUsuarioIgualASomaDosModulos() {
        requisitoService.aprovar(jwt, requisito.getId());
        comentarioService.criar(jwt, new CriarComentarioRequestDTO("oi", "REQUISITO", requisito.getId(), null, null));
        Requisito destino = cenario.requisito(projeto, dono, "RASCUNHO");
        vinculoService.criar(jwt, requisito.getId(), new CriarVinculoRequisitoRequestDTO(destino.getId(), TipoVinculoRequisito.DEPENDE_DE));

        var resumo = interacaoService.resumoPorProjeto(projeto.getId());
        assertThat(resumo.totalInteracoes()).isEqualTo(3);
        assertThat(resumo.interacoesPorModulo()).containsEntry("REQUISITO", 1L).containsEntry("COMENTARIO", 1L).containsEntry("RASTREABILIDADE", 1L);

        var u = resumo.porUsuario().getFirst();
        assertThat(u.totalInteracoes()).isEqualTo(u.interacoesWiki() + u.interacoesRequisito() + u.interacoesComentario()
                + u.interacoesEvento() + u.interacoesArquivo() + u.interacoesModelagemDados() + u.interacoesRastreabilidade());
    }
}
