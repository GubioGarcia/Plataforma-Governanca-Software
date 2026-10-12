package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.repository;

import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.Solicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, UUID> {

    List<Solicitacao> findAllByProjetoIdOrderByDataCriacaoDesc(UUID projetoId);

    List<Solicitacao> findAllByProjetoIdAndSolicitanteIdOrderByDataCriacaoDesc(UUID projetoId, UUID solicitanteId);

    boolean existsByProjetoIdAndTipoAndAlvoIdAndSolicitanteIdAndStatus(
            UUID projetoId, TipoSolicitacao tipo, UUID alvoId, UUID solicitanteId, StatusSolicitacao status);

    boolean existsByProjetoIdAndTipoAndAlvoIdIsNullAndSolicitanteIdAndStatus(
            UUID projetoId, TipoSolicitacao tipo, UUID solicitanteId, StatusSolicitacao status);
}
