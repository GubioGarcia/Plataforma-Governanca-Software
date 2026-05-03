package io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record AtualizarEventoRequestDTO(

        @NotBlank(message = "O nome do evento e obrigatorio")
        @Size(max = 200, message = "Nome deve ter no maximo 200 caracteres")
        String nome,

        @Size(max = 1000, message = "Descricao deve ter no maximo 1000 caracteres")
        String descricao,

        @NotNull(message = "A data/hora de inicio e obrigatoria")
        Instant dataHoraInicio,

        Instant dataHoraFim
) {}