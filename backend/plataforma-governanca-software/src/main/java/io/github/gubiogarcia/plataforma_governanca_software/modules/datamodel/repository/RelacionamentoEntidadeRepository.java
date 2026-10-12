package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.RelacionamentoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RelacionamentoEntidadeRepository extends JpaRepository<RelacionamentoEntidade, UUID> {

    List<RelacionamentoEntidade> findAllByEntidadeOrigemIdOrEntidadeDestinoId(UUID entidadeOrigemId, UUID entidadeDestinoId);

    boolean existsByEntidadeOrigemIdOrEntidadeDestinoId(UUID entidadeOrigemId, UUID entidadeDestinoId);

    /** O relacionamento derivado de um atributo FK específico (atributo_fk_id é UNIQUE). */
    Optional<RelacionamentoEntidade> findByAtributoFkId(UUID atributoFkId);

    boolean existsByAtributoFkId(UUID atributoFkId);

    /** Todos os relacionamentos cujas entidades pertencem ao projeto informado. */
    @Query("""
        SELECT r FROM RelacionamentoEntidade r
        WHERE r.entidadeOrigem.projeto.id = :projetoId
    """)
    List<RelacionamentoEntidade> findAllByProjetoId(@Param("projetoId") UUID projetoId);
}
