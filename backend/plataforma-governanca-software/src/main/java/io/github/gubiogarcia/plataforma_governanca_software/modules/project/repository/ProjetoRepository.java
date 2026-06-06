package io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, UUID> {

    List<Projeto> findAllByOrganizacaoId(UUID organizacaoId);

    List<Projeto> findAllByOrganizacaoIdAndAtivo(UUID organizacaoId, Boolean ativo);

    List<Projeto> findAllByCriadoPorId(UUID usuarioId);

    boolean existsByNomeAndOrganizacaoId(String nome, UUID organizacaoId);

    @Query("SELECT p FROM Projeto p WHERE p.organizacao.id = :orgId AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<Projeto> findByOrganizacaoIdAndNomeContainingIgnoreCase(@Param("orgId") UUID orgId, @Param("nome") String nome);

    @Query("SELECT p.organizacao.id, COUNT(p) FROM Projeto p WHERE p.organizacao.id IN :orgIds AND p.ativo = true GROUP BY p.organizacao.id")
    List<Object[]> countProjetosAtivosByOrganizacaoIds(@Param("orgIds") List<UUID> orgIds);

    long countByOrganizacaoIdAndAtivo(UUID organizacaoId, Boolean ativo);

    boolean existsByStatusId(UUID statusId);
}