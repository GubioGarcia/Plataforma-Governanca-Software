package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RelacionamentoEntidadeRepository extends JpaRepository<RelacionamentoEntidade, UUID> {
    List<RelacionamentoEntidade> findAllByEntidadeOrigemIdOrEntidadeDestinoId(UUID entidadeOrigemId, UUID entidadeDestinoId);
}
