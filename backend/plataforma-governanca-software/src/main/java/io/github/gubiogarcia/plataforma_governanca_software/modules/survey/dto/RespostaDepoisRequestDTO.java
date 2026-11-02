package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

import java.util.List;

/** Etapa "depois": os 5 itens (1 a 5, em ordem) e a aberta opcional. */
public record RespostaDepoisRequestDTO(
        List<Integer> itens,
        String respostaAberta
) {}
