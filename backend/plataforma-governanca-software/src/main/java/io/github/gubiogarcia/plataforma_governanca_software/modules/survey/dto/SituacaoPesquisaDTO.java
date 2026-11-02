package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.InstrumentoPesquisa;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.SituacaoParticipacao;

import java.time.Instant;

/**
 * Situação do usuário na pesquisa e o instrumento vigente.
 *
 * @param situacaoParticipacao nulo quando o usuário nunca respondeu nem recusou
 * @param codigo               código do participante (só enquanto PARTICIPANDO)
 * @param depoisDisponivelEm   quando o "depois" fica liberado (só com o "antes" respondido)
 */
public record SituacaoPesquisaDTO(
        EstadoPesquisa estado,
        SituacaoParticipacao situacaoParticipacao,
        String codigo,
        Instant antesRespondidaEm,
        Instant depoisRespondidaEm,
        Instant depoisDisponivelEm,
        boolean coletaAberta,
        InstrumentoPesquisa.Versao instrumento
) {}
