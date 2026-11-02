package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

/** Abrir/encerrar a coleta e o intervalo mínimo (minutos, 0 a 1440) entre o "antes" e o "depois". */
public record ConfiguracaoPesquisaRequestDTO(Boolean coletaAberta, Integer intervaloMinimoMin) {}
