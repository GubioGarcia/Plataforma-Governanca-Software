package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizacaoRepository extends JpaRepository<Organizacao, UUID> {

    List<Organizacao> findAllByAtivo(Boolean ativo);

    boolean existsByNome(String nome);

    @Query("SELECT o FROM Organizacao o WHERE LOWER(o.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<Organizacao> findByNomeContainingIgnoreCase(@Param("nome") String nome);

    List<Organizacao> findAllByCriadoPor(UUID criadoPor);
}
