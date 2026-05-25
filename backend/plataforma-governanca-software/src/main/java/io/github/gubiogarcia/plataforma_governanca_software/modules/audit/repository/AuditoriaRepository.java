package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, UUID> {

    /**
     * Lista todos os registros de auditoria de uma entidade específica,
     * ordenados do mais recente ao mais antigo.
     */
    @Query("""
            SELECT a FROM Auditoria a
            WHERE a.entidadeTipo = :entidadeTipo
              AND a.entidadeId   = :entidadeId
            ORDER BY a.dataAlteracao DESC
            """)
    List<Auditoria> findByEntidade(
            @Param("entidadeTipo") String entidadeTipo,
            @Param("entidadeId")   UUID   entidadeId
    );

    /**
     * Lista registros de auditoria filtrando apenas por entidadeTipo,
     * útil para páginas de log global de um tipo de entidade.
     */
    @Query("""
            SELECT a FROM Auditoria a
            WHERE a.entidadeTipo = :entidadeTipo
            ORDER BY a.dataAlteracao DESC
            """)
    List<Auditoria> findByEntidadeTipo(
            @Param("entidadeTipo") String entidadeTipo
    );

    /**
     * Lista todos os registros de auditoria de um projeto.
     */
    @Query("""
            SELECT a FROM Auditoria a
            WHERE a.projeto.id = :projetoId
            ORDER BY a.dataAlteracao DESC
            """)
    List<Auditoria> findByProjetoId(@Param("projetoId") UUID projetoId);

    /**
     * Lista todos registros de auditoria de um projeto filtrando por tipo de entidade.
     */
    @Query("""
            SELECT a FROM Auditoria a
            WHERE a.projeto.id   = :projetoId
              AND a.entidadeTipo = :entidadeTipo
            ORDER BY a.dataAlteracao DESC
            """)
    List<Auditoria> findByProjetoIdAndEntidadeTipo(
            @Param("projetoId")    UUID   projetoId,
            @Param("entidadeTipo") String entidadeTipo
    );
}
