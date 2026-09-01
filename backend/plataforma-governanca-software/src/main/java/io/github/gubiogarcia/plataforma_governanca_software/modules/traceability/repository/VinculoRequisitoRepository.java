package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.VinculoRequisito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VinculoRequisitoRepository extends JpaRepository<VinculoRequisito, UUID> {

    List<VinculoRequisito> findAllByRequisitoOrigemIdOrRequisitoDestinoId(UUID requisitoOrigemId, UUID requisitoDestinoId);

    boolean existsByRequisitoOrigemIdAndRequisitoDestinoIdAndTipo(UUID requisitoOrigemId, UUID requisitoDestinoId, TipoVinculoRequisito tipo);

    long countByRequisitoOrigemIdOrRequisitoDestinoId(UUID requisitoOrigemId, UUID requisitoDestinoId);

    /** Todos os vínculos cujo requisito de origem pertence ao projeto informado. */
    @Query("""
        SELECT v FROM VinculoRequisito v
        WHERE v.requisitoOrigem.projeto.id = :projetoId
    """)
    List<VinculoRequisito> findAllByProjetoId(@Param("projetoId") UUID projetoId);
}
