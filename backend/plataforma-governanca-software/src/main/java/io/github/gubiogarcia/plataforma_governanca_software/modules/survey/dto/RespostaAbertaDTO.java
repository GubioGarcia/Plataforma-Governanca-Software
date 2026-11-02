package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.EtapaPesquisa;

import java.time.Instant;

/** Resposta aberta identificada só pelo código do participante. */
public record RespostaAbertaDTO(String codigo, EtapaPesquisa etapa, String texto, Instant respondidaEm) {}
