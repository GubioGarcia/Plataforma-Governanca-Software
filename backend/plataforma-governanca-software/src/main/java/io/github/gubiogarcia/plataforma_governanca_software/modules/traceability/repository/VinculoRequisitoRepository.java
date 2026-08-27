package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.VinculoRequisito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VinculoRequisitoRepository extends JpaRepository<VinculoRequisito, UUID> {
    List<VinculoRequisito> findAllByRequisitoOrigemIdOrRequisitoDestinoId(UUID requisitoOrigemId, UUID requisitoDestinoId);
}
