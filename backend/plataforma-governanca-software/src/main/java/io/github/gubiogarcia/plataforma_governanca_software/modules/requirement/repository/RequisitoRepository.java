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

    /** Conta todos os requisitos (ativos e inativos) do projeto para gerar o próximo código sequencial */
    @Query("SELECT COUNT(r) FROM Requisito r WHERE r.projeto.id = :projetoId")
    long countAllByProjetoId(@Param("projetoId") UUID projetoId);
}
