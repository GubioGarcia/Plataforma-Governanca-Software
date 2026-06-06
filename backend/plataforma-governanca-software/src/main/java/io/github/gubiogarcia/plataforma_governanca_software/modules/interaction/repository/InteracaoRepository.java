package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.Interacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InteracaoRepository extends JpaRepository<Interacao, UUID> {

    List<Interacao> findAllByProjetoId(UUID projetoId);

    List<Interacao> findAllByProjetoIdAndUsuarioId(UUID projetoId, UUID usuarioId);

    long countByProjetoId(UUID projetoId);

    long countByProjetoIdAndUsuarioId(UUID projetoId, UUID usuarioId);

    long countByProjetoIdAndUsuarioIdAndModulo(UUID projetoId, UUID usuarioId, ModuloInteracao modulo);

    /** Retorna pares (usuarioId, totalInteracoes) para todos os membros de um projeto. */
    @Query("""
        SELECT i.usuario.id AS usuarioId, COUNT(i) AS total
        FROM Interacao i
        WHERE i.projeto.id = :projetoId
        GROUP BY i.usuario.id
    """)
    List<Object[]> countByProjetoGroupByUsuario(@Param("projetoId") UUID projetoId);

    /** Retorna pares (usuarioId, modulo, total) para um projeto. */
    @Query("""
        SELECT i.usuario.id AS usuarioId, i.modulo AS modulo, COUNT(i) AS total
        FROM Interacao i
        WHERE i.projeto.id = :projetoId
        GROUP BY i.usuario.id, i.modulo
    """)
    List<Object[]> countByProjetoGroupByUsuarioAndModulo(@Param("projetoId") UUID projetoId);

    /** Retorna pares (modulo, total) para um projeto — uso por módulo. */
    @Query("""
        SELECT i.modulo AS modulo, COUNT(i) AS total
        FROM Interacao i
        WHERE i.projeto.id = :projetoId
        GROUP BY i.modulo
    """)
    List<Object[]> countByProjetoGroupByModulo(@Param("projetoId") UUID projetoId);
}
