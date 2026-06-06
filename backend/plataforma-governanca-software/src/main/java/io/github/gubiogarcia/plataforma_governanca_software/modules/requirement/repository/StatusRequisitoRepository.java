package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusRequisitoRepository extends JpaRepository<StatusRequisito, UUID> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByOrdem(Integer ordem);

    Optional<StatusRequisito> findByNomeIgnoreCase(String nome);
}