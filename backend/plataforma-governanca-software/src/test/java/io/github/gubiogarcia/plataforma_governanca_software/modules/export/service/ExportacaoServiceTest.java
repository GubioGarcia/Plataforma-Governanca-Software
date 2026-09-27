package io.github.gubiogarcia.plataforma_governanca_software.modules.export.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto.SolicitacaoDTOs.CriarSolicitacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.service.SolicitacaoService;
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

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste.grupoOrg;
import static org.assertj.core.api.Assertions.*;

/** Exportação CSV (D13): gestor exporta direto; stakeholder só depois de solicitação atendida. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class ExportacaoServiceTest {

    @Autowired private ExportacaoService service;
    @Autowired private SolicitacaoService solicitacaoService;
    @Autowired private CenarioProjetoTeste cenario;

    @MockitoBean private JwtDecoder jwtDecoder;

    private Usuario dono, membro, estranho;
    private Organizacao org;
    private Projeto projeto;

    @BeforeEach
    void setUp() {
        dono = cenario.usuario("dono.exp@x.com");
        membro = cenario.usuario("membro.exp@x.com");
        estranho = cenario.usuario("estranho.exp@x.com");
        org = cenario.organizacao("Org Exportação", dono);
        projeto = cenario.projeto("Projeto Exportação Ágil", org, dono);
    }

    @AfterEach
    void limpar() {
        AutenticacaoTeste.limpar();
    }

    private void comoDono()   { AutenticacaoTeste.comGrupos(dono.getExternalIdentityId(), grupoOrg(org, "_dono")); }
    private void comoMembro() { AutenticacaoTeste.comGrupos(membro.getExternalIdentityId(), grupoOrg(org, "_membros")); }

    @Test
    void gestorExportaMer_comBomCabecalhoENomeDoArquivo() {
        comoDono();
        var arquivo = service.exportarMer(projeto.getId());
        String csv = new String(arquivo.conteudo(), StandardCharsets.UTF_8);

        assertThat(arquivo.nomeArquivo()).isEqualTo("modelagem-projeto-exportacao-agil.csv");
        assertThat(csv).startsWith("﻿");
        assertThat(csv.substring(1)).startsWith("entidade;descricao_entidade;atributo;tipo;obrigatorio;"
                + "chave_primaria;chave_estrangeira;entidade_referenciada;tipo_relacionamento\r\n");
    }

    @Test
    void gestorExportaRastreabilidade() {
        comoDono();
        var arquivo = service.exportarRastreabilidade(projeto.getId());
        assertThat(arquivo.nomeArquivo()).isEqualTo("rastreabilidade-projeto-exportacao-agil.csv");
        assertThat(new String(arquivo.conteudo(), StandardCharsets.UTF_8)).contains("origem;origem_titulo;destino");
    }

    @Test
    void stakeholder_bloqueadoAteSolicitacaoAtendida_eSoParaOTipoPedido() {
        comoMembro();
        assertThatThrownBy(() -> service.exportarMer(projeto.getId()))
                .isInstanceOf(AcessoNegadoException.class)
                .hasMessageContaining("não liberada");
        UUID id = solicitacaoService.criar(projeto.getId(),
                new CriarSolicitacaoRequestDTO(TipoSolicitacao.EXPORT_MER, null, null, null)).id();

        comoDono();
        solicitacaoService.atender(id, null);

        comoMembro();
        assertThat(service.exportarMer(projeto.getId()).conteudo()).isNotEmpty();
        assertThatThrownBy(() -> service.exportarRastreabilidade(projeto.getId()))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void semVinculo_naoExporta() {
        AutenticacaoTeste.comGrupos(estranho.getExternalIdentityId());
        assertThatThrownBy(() -> service.exportarMer(projeto.getId()))
                .isInstanceOf(AcessoNegadoException.class)
                .hasMessageContaining("não tem permissão");
    }
}
