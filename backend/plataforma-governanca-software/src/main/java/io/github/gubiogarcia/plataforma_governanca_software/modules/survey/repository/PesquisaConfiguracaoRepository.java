package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.PesquisaConfiguracao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PesquisaConfiguracaoRepository extends JpaRepository<PesquisaConfiguracao, Short> {
}
