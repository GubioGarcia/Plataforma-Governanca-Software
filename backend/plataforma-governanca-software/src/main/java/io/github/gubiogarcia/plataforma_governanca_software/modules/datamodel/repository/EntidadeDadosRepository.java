package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.EntidadeDados;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EntidadeDadosRepository extends JpaRepository<EntidadeDados, UUID> {

    List<EntidadeDados> findAllByProjetoId(UUID projetoId);

    List<EntidadeDados> findAllByProjetoIdAndAtivoTrue(UUID projetoId);

    boolean existsByProjetoIdAndNomeIgnoreCase(UUID projetoId, String nome);
}
