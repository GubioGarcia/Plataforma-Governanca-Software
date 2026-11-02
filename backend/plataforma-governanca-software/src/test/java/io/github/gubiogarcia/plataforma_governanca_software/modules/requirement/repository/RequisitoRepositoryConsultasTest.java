package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.support.CenarioProjetoTeste;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guarda contra N+1: listar os requisitos de um projeto e ler status e autores
 * deve custar uma única consulta, não uma por requisito.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Transactional
class RequisitoRepositoryConsultasTest {

    @Autowired private CenarioProjetoTeste cenario;
    @Autowired private RequisitoRepository requisitoRepository;
    @Autowired private EntityManager em;

    @Test
    void listarPorProjeto_naoDispara_umaConsultaPorRequisito() {
        Usuario criador = cenario.usuario("n1@teste.com");
        Organizacao org = cenario.organizacao("Org N+1", criador);
        Projeto projeto = cenario.projeto("Projeto N+1", org, criador);
        for (int i = 0; i < 5; i++) {
            cenario.requisito(projeto, cenario.usuario("autor" + i + "@teste.com"), "RASCUNHO");
        }
        em.flush();
        em.clear();

        Statistics stats = em.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        List<Requisito> requisitos = requisitoRepository.findAllByProjetoId(projeto.getId());
        requisitos.forEach(r -> {
            r.getStatus().getNome();
            r.getCriadoPor().getNome();
        });

        assertThat(requisitos).hasSize(5);
        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }
}
