package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarComentarioRequestDTO(
        @NotBlank(message = "O conteúdo do comentário não pode ser vazio.")
        @Size(max = 2000, message = "O comentário não pode ultrapassar 2000 caracteres.")
        String conteudo
) {}
