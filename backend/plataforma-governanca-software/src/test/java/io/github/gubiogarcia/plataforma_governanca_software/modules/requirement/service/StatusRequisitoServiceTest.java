package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.shared.DadoReferenciaSistemaException;
import io.github.gubiogarcia.plataforma_governanca_software.support.AutenticacaoTeste;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Testes de integração das regras de StatusRequisitoService, em especial a proteção
 * dos status de sistema (usados pelo nome no fluxo de aprovação).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class StatusRequisitoServiceTest {

    @Autowired private StatusRequisitoService statusRequisitoService;
    @Autowired private StatusRequisitoRepository statusRequisitoRepository;
    @Autowired private EntityManager entityManager;

    // Substitui o JwtDecoder que tenta conectar ao Keycloak na inicialização
    @MockitoBean
    private JwtDecoder jwtDecoder;

    // Lista global: escrita só pelo Admin da Plataforma (grupo /_admin)
    @BeforeEach
    void autenticarComoAdmin() {
        AutenticacaoTeste.comoAdminDaPlataforma(UUID.randomUUID());
    }

    @AfterEach
    void limparAutenticacao() {
        AutenticacaoTeste.limpar();
    }

    private StatusRequisito statusDeSistema() {
        return statusRequisitoRepository.save(StatusRequisito.builder()
                .nome("SISTEMA_TESTE").descricao("Usado pelas regras").ordem(70).sistema(true).build());
    }

    @Test
    void atualizar_deveNegarAcesso_quandoUsuarioNaoEAdminDaPlataforma() {
        StatusRequisito status = statusDeSistema();
        AutenticacaoTeste.comoDonoDaOrganizacao(UUID.randomUUID(), UUID.randomUUID());

        assertThatThrownBy(() -> statusRequisitoService.atualizar(status.getId(),
                new AtualizarStatusRequisitoRequestDTO("SISTEMA_TESTE", "Outra", 70)))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void criar_deveCriarStatusQueNaoEDeSistema() {
        var criado = statusRequisitoService.criar(new CriarStatusRequisitoRequestDTO("NOVO_COMUM", null, 71));

        assertThat(criado.sistema()).isFalse();
    }

    @Test
    void atualizar_deveLancarException_quandoRenomeiaStatusDeSistema() {
        StatusRequisito status = statusDeSistema();

        assertThatThrownBy(() -> statusRequisitoService.atualizar(status.getId(),
                new AtualizarStatusRequisitoRequestDTO("RENOMEADO", "Usado pelas regras", 70)))
                .isInstanceOf(DadoReferenciaSistemaException.class);
        entityManager.flush();
        entityManager.clear();
        assertThat(statusRequisitoRepository.findById(status.getId()).orElseThrow().getNome()).isEqualTo("SISTEMA_TESTE");
    }

    @Test
    void atualizar_devePermitirDescricaoEOrdem_quandoStatusDeSistema() {
        StatusRequisito status = statusDeSistema();

        var resultado = statusRequisitoService.atualizar(status.getId(),
                new AtualizarStatusRequisitoRequestDTO("SISTEMA_TESTE", "Nova descrição", 72));

        assertThat(resultado.descricao()).isEqualTo("Nova descrição");
        assertThat(resultado.ordem()).isEqualTo(72);
        assertThat(resultado.sistema()).isTrue();
    }

    @Test
    void atualizar_devePermitirRenomear_quandoStatusNaoEDeSistema() {
        var criado = statusRequisitoService.criar(new CriarStatusRequisitoRequestDTO("COMUM", null, 73));

        var resultado = statusRequisitoService.atualizar(criado.id(),
                new AtualizarStatusRequisitoRequestDTO("COMUM_RENOMEADO", null, 73));

        assertThat(resultado.nome()).isEqualTo("COMUM_RENOMEADO");
    }

    @Test
    void deletar_deveLancarException_quandoStatusDeSistema() {
        StatusRequisito status = statusDeSistema();

        assertThatThrownBy(() -> statusRequisitoService.deletar(status.getId()))
                .isInstanceOf(DadoReferenciaSistemaException.class);
        assertThat(statusRequisitoRepository.existsById(status.getId())).isTrue();
    }

    @Test
    void deletar_deveRemover_quandoStatusNaoEDeSistemaENaoEstaEmUso() {
        var criado = statusRequisitoService.criar(new CriarStatusRequisitoRequestDTO("DESCARTAVEL", null, 74));

        statusRequisitoService.deletar(criado.id());

        assertThat(statusRequisitoRepository.existsById(criado.id())).isFalse();
    }
}
