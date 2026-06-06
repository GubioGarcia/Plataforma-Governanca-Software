package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CriarComentarioRequestDTO(
        @NotBlank(message = "O conteúdo do comentário é obrigatório.")
        @Size(max = 2000, message = "O comentário não pode ultrapassar 2000 caracteres.")
        String conteudo,

        @NotBlank(message = "O tipo de entidade é obrigatório.")
        String entidadeTipo,

        @NotNull(message = "O id da entidade é obrigatório.")
        UUID entidadeId,

        @NotNull(message = "O id do projeto é obrigatório.")
        UUID projetoId,

        @NotNull(message = "O id da organização é obrigatório.")
        UUID organizacaoId
) {}
