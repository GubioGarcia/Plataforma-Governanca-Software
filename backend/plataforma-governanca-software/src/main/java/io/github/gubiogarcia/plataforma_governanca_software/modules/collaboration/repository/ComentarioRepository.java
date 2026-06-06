package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.domain.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, UUID> {
    List<Comentario> findAll();

    /**
     * Lista comentários ativos de uma entidade, ordenados cronologicamente (mais antigo primeiro).
     * O par (entidadeTipo + entidadeId) garante o isolamento por entidade.
     */
    @Query("""
            SELECT c FROM Comentario c
            WHERE c.entidadeTipo = :entidadeTipo
              AND c.entidadeId   = :entidadeId
              AND c.ativo        = true
            ORDER BY c.dataCriacao ASC
            """)
    List<Comentario> findAtivosByEntidade(
            @Param("entidadeTipo") String entidadeTipo,
            @Param("entidadeId")   UUID entidadeId
    );

    /**
     * Verifica se existe algum comentário ativo na mesma thread que foi criado
     * APÓS o instante informado.
     *
     * Usado para bloquear a exclusão de comentários que já possuem respostas
     * (comentários posteriores na mesma thread).
     */
    @Query("""
            SELECT COUNT(c) > 0 FROM Comentario c
            WHERE c.entidadeTipo = :entidadeTipo
              AND c.entidadeId   = :entidadeId
              AND c.ativo        = true
              AND c.dataCriacao  > :apos
            """)
    boolean existsAtivoApos(
            @Param("entidadeTipo") String  entidadeTipo,
            @Param("entidadeId")   UUID    entidadeId,
            @Param("apos")         Instant apos
    );
}
