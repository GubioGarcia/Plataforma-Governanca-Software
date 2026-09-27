package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusEvento;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.EventoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.CriarSolicitacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.EventoSolicitadoDTO;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoProj;
import static org.assertj.core.api.Assertions.*;

/** Solicitações (D12 / Passo 5): permissões por tipo, regras de estado, resposta, evento e exportação. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class SolicitacaoServiceTest {

    @Autowired private SolicitacaoService service;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario gestor, cliente, tecnico;
    private Organizacao org;
    private Projeto projeto, outroProjeto;
    private Requisito rascunho, aprovado;

    @BeforeEach
    void setUp() {
        gestor = cenario.usuario("gestor.sol@x.com");
        cliente = cenario.usuario("cliente.sol@x.com");
        tecnico = cenario.usuario("tecnico.sol@x.com");
        org = cenario.organizacao("Org Solicitações", gestor);
        projeto = cenario.projeto("Proj Solicitações", org, gestor);
        outroProjeto = cenario.projeto("Outro Proj Solicitações", org, gestor);
        cenario.statusDeRequisito();
        rascunho = cenario.requisito(projeto, gestor, "RASCUNHO");
        aprovado = cenario.requisito(projeto, gestor, "APROVADO");
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void comoGestor()  { AutenticacaoTeste.comGrupos(gestor.getExternalIdentityId(), grupoOrg(org, "_dono")); }
    private void comoCliente() {
        AutenticacaoTeste.comGrupos(cliente.getExternalIdentityId(),
                grupoProj(projeto, "_stakeholders_tecnicos"), grupoProj(projeto, "_stakeholders_clientes"));
    }
    private void comoTecnico() { AutenticacaoTeste.comGrupos(tecnico.getExternalIdentityId(), grupoOrg(org, "_membros")); }

    private CriarSolicitacaoRequestDTO sobre(TipoSolicitacao tipo, Requisito r) {
        return new CriarSolicitacaoRequestDTO(tipo, r.getId(), "motivo", null);
    }

    // ── Criação e regras de estado ────────────────────────────────────────────

    @Test
    void alteracaoEReprovacao_soDeRequisitoAprovado() {
        comoTecnico();
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, rascunho)))
                .isInstanceOf(SolicitacaoService.SolicitacaoInvalidaException.class);

        var s = service.criar(projeto.getId(), sobre(TipoSolicitacao.REPROVACAO_REQUISITO, aprovado));
        assertThat(s.status()).isEqualTo(StatusSolicitacao.PENDENTE);
        assertThat(s.alvoDescricao()).contains(aprovado.getCodigo());
    }

    @Test
    void aprovacao_soStakeholderCliente_eSoDeRequisitoNaoAprovado() {
        comoTecnico();   // Membro da org = Técnico, sem REQ_REQUEST_APPROVAL (D10)
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.APROVACAO_REQUISITO, rascunho)))
                .isInstanceOf(AcessoNegadoException.class);

        comoCliente();
        assertThat(service.criar(projeto.getId(), sobre(TipoSolicitacao.APROVACAO_REQUISITO, rascunho))).isNotNull();
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.APROVACAO_REQUISITO, aprovado)))
                .isInstanceOf(SolicitacaoService.SolicitacaoInvalidaException.class);
    }

    @Test
    void gestorNaoSolicita_eRequisitoDeOutroProjetoOuPendenteRepetida_saoRecusados() {
        comoGestor();
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado)))
                .isInstanceOf(AcessoNegadoException.class);

        comoTecnico();
        Requisito deOutro = cenario.requisito(outroProjeto, gestor, "APROVADO");
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, deOutro)))
                .isInstanceOf(SolicitacaoService.SolicitacaoInvalidaException.class);

        service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado));
        assertThatThrownBy(() -> service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado)))
                .isInstanceOf(SolicitacaoService.SolicitacaoDuplicadaException.class);
    }

    // ── Listagem e resposta ───────────────────────────────────────────────────

    @Test
    void stakeholderVeSoAsProprias_gestorVeTodas() {
        comoTecnico();
        service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado));
        comoCliente();
        service.criar(projeto.getId(), sobre(TipoSolicitacao.APROVACAO_REQUISITO, rascunho));

        assertThat(service.listar(projeto.getId(), null)).hasSize(1);
        comoGestor();
        assertThat(service.listar(projeto.getId(), null)).hasSize(2);
        assertThat(service.listar(projeto.getId(), StatusSolicitacao.ATENDIDA)).isEmpty();
    }

    @Test
    void soResponsavelAtendeOuRecusa_eSoPendente() {
        comoTecnico();
        UUID id = service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado)).id();
        assertThatThrownBy(() -> service.atender(id, null)).isInstanceOf(AcessoNegadoException.class);

        comoGestor();
        var atendida = service.atender(id, "feito");
        assertThat(atendida.status()).isEqualTo(StatusSolicitacao.ATENDIDA);
        assertThat(atendida.respondidoPorNome()).isEqualTo(gestor.getNome());
        assertThat(atendida.resposta()).isEqualTo("feito");
        assertThatThrownBy(() -> service.recusar(id, null)).isInstanceOf(SolicitacaoService.SolicitacaoInvalidaException.class);
    }

    @Test
    void cancelar_soOSolicitante() {
        comoTecnico();
        UUID id = service.criar(projeto.getId(), sobre(TipoSolicitacao.ALTERACAO_REQUISITO, aprovado)).id();

        comoGestor();
        assertThatThrownBy(() -> service.cancelar(id)).isInstanceOf(AcessoNegadoException.class);

        comoTecnico();
        assertThat(service.cancelar(id).status()).isEqualTo(StatusSolicitacao.CANCELADA);
    }

    // ── Evento ────────────────────────────────────────────────────────────────

    @Test
    void evento_nasceSolicitado_eSegueADecisao() {
        comoCliente();
        var dados = new EventoSolicitadoDTO("Reunião", null, Instant.now().plusSeconds(3600), null);
        var aprovavel = service.criar(projeto.getId(), new CriarSolicitacaoRequestDTO(TipoSolicitacao.EVENTO, null, null, dados));
        var recusavel = service.criar(projeto.getId(), new CriarSolicitacaoRequestDTO(TipoSolicitacao.EVENTO, null, null, dados));
        var cancelavel = service.criar(projeto.getId(), new CriarSolicitacaoRequestDTO(TipoSolicitacao.EVENTO, null, null, dados));
        assertThat(eventoRepository.findById(aprovavel.alvoId()).orElseThrow().getStatus()).isEqualTo(StatusEvento.SOLICITADO);

        comoGestor();
        service.atender(aprovavel.id(), null);
        service.recusar(recusavel.id(), null);
        assertThat(eventoRepository.findById(aprovavel.alvoId()).orElseThrow().getStatus()).isEqualTo(StatusEvento.APROVADO);
        assertThat(eventoRepository.findById(recusavel.alvoId()).orElseThrow().getStatus()).isEqualTo(StatusEvento.REJEITADO);

        comoCliente();
        service.cancelar(cancelavel.id());
        assertThat(eventoRepository.findById(cancelavel.alvoId())).isEmpty();   // evento pedido descartado
    }

    @Test
    void evento_semDados_eRecusado() {
        comoCliente();
        assertThatThrownBy(() -> service.criar(projeto.getId(),
                new CriarSolicitacaoRequestDTO(TipoSolicitacao.EVENTO, null, null, null)))
                .isInstanceOf(SolicitacaoService.SolicitacaoInvalidaException.class);
    }

    // ── Exportação ────────────────────────────────────────────────────────────

    @Test
    void exportacao_liberadaSoDepoisDeAtendida() {
        comoTecnico();
        UUID id = service.criar(projeto.getId(), new CriarSolicitacaoRequestDTO(TipoSolicitacao.EXPORT_MER, null, null, null)).id();
        assertThat(service.exportacaoLiberada(projeto, TipoSolicitacao.EXPORT_MER)).isFalse();

        comoGestor();
        service.atender(id, null);

        comoTecnico();
        assertThat(service.exportacaoLiberada(projeto, TipoSolicitacao.EXPORT_MER)).isTrue();
        assertThat(service.exportacaoLiberada(projeto, TipoSolicitacao.EXPORT_RASTREABILIDADE)).isFalse();
    }
}
