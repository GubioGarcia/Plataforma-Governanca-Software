package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.ImpactoDados;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImpactoDadosRepository extends JpaRepository<ImpactoDados, UUID> {

    List<ImpactoDados> findAllByRequisitoId(UUID requisitoId);

    List<ImpactoDados> findAllByEntidadeId(UUID entidadeId);

    List<ImpactoDados> findAllByAtributoId(UUID atributoId);

    /**
     * Vínculo INDIRETO da matriz de rastreabilidade (Ponto 1B): requisitos
     * diferentes de {@code requisitoId} que possuem ImpactoDados apontando
     * para a mesma EntidadeDados que {@code requisitoId} impacta.
     */
    @Query("""
        SELECT DISTINCT b.requisito
        FROM ImpactoDados a
        JOIN ImpactoDados b ON b.entidade.id = a.entidade.id AND b.requisito.id <> a.requisito.id
        WHERE a.requisito.id = :requisitoId
    """)
    List<Requisito> findRequisitosRelacionadosIndiretamente(@Param("requisitoId") UUID requisitoId);
}
