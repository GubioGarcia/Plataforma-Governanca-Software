package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.Ferramenta;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.FuncaoParticipante;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.TempoExperiencia;

import java.util.List;

/** Etapa "antes": consentimento, os 5 itens (1 a 5, em ordem), a aberta opcional e a caracterização. */
public record RespostaAntesRequestDTO(
        Boolean consentimento,
        List<Integer> itens,
        String respostaAberta,
        FuncaoParticipante funcao,
        TempoExperiencia tempoExperiencia,
        List<Ferramenta> ferramentas,
        String ferramentaOutro
) {}
