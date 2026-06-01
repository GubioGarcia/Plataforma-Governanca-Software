package io.github.gubiogarcia.plataforma_governanca_software.modules.files.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.files.domain.ArquivoProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArquivoProjetoRepository extends JpaRepository<ArquivoProjeto, UUID> {

    List<ArquivoProjeto> findAllByProjetoIdAndAtivoTrue(UUID projetoId);

    Optional<ArquivoProjeto> findByIdAndAtivoTrue(UUID id);
}
