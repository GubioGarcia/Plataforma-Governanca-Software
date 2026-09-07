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

    List<ImpactoDados> findAllByRequisitoIdOrderByEntidadeNomeAscDataCriacaoAsc(UUID requisitoId);

    List<ImpactoDados> findAllByEntidadeId(UUID entidadeId);

    List<ImpactoDados> findAllByAtributoId(UUID atributoId);

    boolean existsByEntidadeId(UUID entidadeId);

    boolean existsByAtributoId(UUID atributoId);

    /**
     * Quantos requisitos ativos distintos impactam a entidade informada.
     */
    @Query("""
        SELECT COUNT(DISTINCT i.requisito.id)
        FROM ImpactoDados i
        WHERE i.entidade.id = :entidadeId AND i.requisito.ativo = true
    """)
    long countRequisitosAtivosQueImpactam(@Param("entidadeId") UUID entidadeId);

    /**
     * Quantas entidades distintas o requisito informado impacta.
     */
    @Query("""
        SELECT COUNT(DISTINCT i.entidade.id)
        FROM ImpactoDados i
        WHERE i.requisito.id = :requisitoId
    """)
    long countEntidadesDistintasByRequisitoId(@Param("requisitoId") UUID requisitoId);

    /**
     * Vínculo INDIRETO da matriz de rastreabilidade (Ponto 1B): requisitos
     * ativos diferentes de {@code requisitoId} que possuem ImpactoDados
     * apontando para a mesma EntidadeDados que {@code requisitoId} impacta.
     */
    @Query("""
        SELECT DISTINCT b.requisito
        FROM ImpactoDados a
        JOIN ImpactoDados b ON b.entidade.id = a.entidade.id AND b.requisito.id <> a.requisito.id
        WHERE a.requisito.id = :requisitoId
          AND a.requisito.ativo = true
          AND b.requisito.ativo = true
    """)
    List<Requisito> findRequisitosRelacionadosIndiretamente(@Param("requisitoId") UUID requisitoId);

    /**
     * Todos os pares (requisitoOrigemId, requisitoDestinoId, nomeEntidadeCompartilhada)
     * de um projeto que ficam relacionados INDIRETAMENTE por compartilharem uma
     * EntidadeDados via ImpactoDados. Retornado como {@code Object[]{UUID, UUID, String}}.
     * Cada par não-ordenado aparece nos dois sentidos (a→b e b→a).
     */
    @Query("""
        SELECT a.requisito.id, b.requisito.id, a.entidade.nome
        FROM ImpactoDados a
        JOIN ImpactoDados b ON b.entidade.id = a.entidade.id AND b.requisito.id <> a.requisito.id
        WHERE a.requisito.projeto.id = :projetoId
          AND a.requisito.ativo = true
          AND b.requisito.ativo = true
    """)
    List<Object[]> findParesIndiretosByProjetoId(@Param("projetoId") UUID projetoId);
}
