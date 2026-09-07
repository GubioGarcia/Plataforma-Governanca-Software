package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.AtributoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AtributoEntidadeRepository extends JpaRepository<AtributoEntidade, UUID> {

    List<AtributoEntidade> findAllByEntidadeId(UUID entidadeId);

    List<AtributoEntidade> findAllByEntidadeIdOrderByOrdemAscNomeAsc(UUID entidadeId);

    List<AtributoEntidade> findAllByEntidadeProjetoIdOrderByOrdemAscNomeAsc(UUID projetoId);

    boolean existsByEntidadeIdAndNomeIgnoreCase(UUID entidadeId, String nome);

    long countByEntidadeId(UUID entidadeId);
}
