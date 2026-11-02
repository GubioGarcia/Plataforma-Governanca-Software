package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.PesquisaParticipacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PesquisaParticipacaoRepository extends JpaRepository<PesquisaParticipacao, UUID> {

    Optional<PesquisaParticipacao> findByUsuarioId(UUID usuarioId);

    /** Próximo número do código do participante (P-001, ...). */
    @Query(value = "SELECT nextval('pesquisa_codigo_seq')", nativeQuery = true)
    long proximoNumeroCodigo();
}
