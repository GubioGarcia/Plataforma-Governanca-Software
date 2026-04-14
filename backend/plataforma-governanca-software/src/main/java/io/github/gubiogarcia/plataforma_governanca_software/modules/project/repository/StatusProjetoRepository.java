package io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatusProjetoRepository extends JpaRepository<StatusProjeto, UUID> {

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByOrdem(Integer ordem);

    Optional<StatusProjeto> findByNomeIgnoreCase(String nome);
}
