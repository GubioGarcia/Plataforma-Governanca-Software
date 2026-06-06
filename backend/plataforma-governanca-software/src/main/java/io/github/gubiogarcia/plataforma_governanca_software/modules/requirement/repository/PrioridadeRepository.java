package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Prioridade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrioridadeRepository extends JpaRepository<Prioridade, UUID> {
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByOrdem(Integer ordem);
    Optional<Prioridade> findByCodigoIgnoreCase(String codigo);
    List<Prioridade> findAllByAtivoTrue();
}
