package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RelacionamentoEntidadeRepository extends JpaRepository<RelacionamentoEntidade, UUID> {

    List<RelacionamentoEntidade> findAllByEntidadeOrigemIdOrEntidadeDestinoId(UUID entidadeOrigemId, UUID entidadeDestinoId);

    boolean existsByEntidadeOrigemIdAndEntidadeDestinoIdAndTipo(UUID entidadeOrigemId, UUID entidadeDestinoId, TipoRelacionamentoEntidade tipo);

    boolean existsByEntidadeOrigemIdOrEntidadeDestinoId(UUID entidadeOrigemId, UUID entidadeDestinoId);

    /** Todos os relacionamentos cujas entidades pertencem ao projeto informado. */
    @Query("""
        SELECT r FROM RelacionamentoEntidade r
        WHERE r.entidadeOrigem.projeto.id = :projetoId
    """)
    List<RelacionamentoEntidade> findAllByProjetoId(@Param("projetoId") UUID projetoId);
}
