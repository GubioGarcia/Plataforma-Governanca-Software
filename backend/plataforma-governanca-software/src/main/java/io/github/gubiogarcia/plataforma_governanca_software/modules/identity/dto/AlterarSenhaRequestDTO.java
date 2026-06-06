package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequestDTO(

        @NotBlank(message = "O e-mail é obrigatório para identificar o usuário")
        String email,

        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = 8, message = "A nova senha deve ter no mínimo 8 caracteres")
        String novaSenha,

        @NotBlank(message = "A confirmação de senha é obrigatória")
        String confirmacaoSenha
) {}