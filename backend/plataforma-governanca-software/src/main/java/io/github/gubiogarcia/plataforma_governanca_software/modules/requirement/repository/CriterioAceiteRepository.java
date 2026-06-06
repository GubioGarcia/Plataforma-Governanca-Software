package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.CriterioAceite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CriterioAceiteRepository extends JpaRepository<CriterioAceite, UUID> {
    List<CriterioAceite> findAllByRequisitoIdOrderByDataCriacaoAsc(UUID requisitoId);
}
