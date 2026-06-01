package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequisitoRepository extends JpaRepository<Requisito, UUID> {
    List<Requisito> findAllByProjetoId(UUID projetoId);
    boolean existsByStatusId(UUID statusId);
    boolean existsByPrioridadeId(UUID prioridadeId);

    /**
     * Retorna o maior número sequencial já usado nos códigos REQ-NNN do projeto.
     * Usado para gerar o próximo código sem risco de duplicata mesmo após inativações.
     */
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(r.codigo, 5) AS int)), 0) FROM Requisito r WHERE r.projeto.id = :projetoId")
    long findMaxSequencialByProjetoId(@Param("projetoId") UUID projetoId);
}
