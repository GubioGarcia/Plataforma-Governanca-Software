package io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventoRepository extends JpaRepository<Evento, UUID> {
    List<Evento> findAllByProjetoId(UUID projetoId);
    List<Evento> findAllByOrganizacaoId(UUID organizacaoId);
}