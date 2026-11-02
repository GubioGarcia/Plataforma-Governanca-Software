package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.EtapaPesquisa;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.PesquisaResposta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PesquisaRespostaRepository extends JpaRepository<PesquisaResposta, UUID> {

    List<PesquisaResposta> findAllByParticipacaoId(UUID participacaoId);

    Optional<PesquisaResposta> findByParticipacaoIdAndEtapa(UUID participacaoId, EtapaPesquisa etapa);

    @Modifying
    @Query("DELETE FROM PesquisaResposta r WHERE r.participacao.id = :participacaoId")
    void apagarDaParticipacao(@Param("participacaoId") UUID participacaoId);

    /** Respostas abertas preenchidas, mais recentes primeiro; etapa nula traz as duas. */
    @Query("""
        SELECT r FROM PesquisaResposta r
        WHERE r.respostaAberta IS NOT NULL
          AND (:etapa IS NULL OR r.etapa = :etapa)
        ORDER BY r.respondidaEm DESC
    """)
    Page<PesquisaResposta> listarAbertas(@Param("etapa") EtapaPesquisa etapa, Pageable pageable);
}
