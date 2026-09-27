package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.StatusSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/** DTOs das solicitações. */
public final class SolicitacaoDTOs {

    private SolicitacaoDTOs() {}

    /**
     * alvoId: requisito (tipos *_REQUISITO); nulo em EVENTO e exportações.
     * evento: dados do evento pedido (obrigatório no tipo EVENTO).
     */
    public record CriarSolicitacaoRequestDTO(
            @NotNull(message = "O tipo da solicitação é obrigatório.")
            TipoSolicitacao tipo,
            UUID alvoId,
            @Size(max = 2000, message = "A justificativa pode ter no máximo 2000 caracteres.")
            String justificativa,
            @Valid
            EventoSolicitadoDTO evento
    ) {}

    public record EventoSolicitadoDTO(
            @NotNull(message = "O nome do evento é obrigatório.")
            @Size(max = 255)
            String nome,
            @Size(max = 2000)
            String descricao,
            @NotNull(message = "A data/hora de início é obrigatória.")
            Instant dataHoraInicio,
            Instant dataHoraFim
    ) {}

    public record ResponderSolicitacaoRequestDTO(
            @Size(max = 2000, message = "A resposta pode ter no máximo 2000 caracteres.")
            String resposta
    ) {}

    public record SolicitacaoResponseDTO(
            UUID id,
            UUID projetoId,
            TipoSolicitacao tipo,
            UUID alvoId,
            String alvoDescricao,
            StatusSolicitacao status,
            UUID solicitanteId,
            String solicitanteNome,
            String justificativa,
            String respondidoPorNome,
            String resposta,
            Instant dataCriacao,
            Instant dataResposta
    ) {}
}
