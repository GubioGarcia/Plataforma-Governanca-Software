package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * O usuário é identificado pelo token (rota autenticada); a senha atual é
 * conferida no Keycloak antes da troca.
 */
public record AlterarSenhaRequestDTO(

        @NotBlank(message = "A senha atual é obrigatória")
        String senhaAtual,

        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = 8, message = "A nova senha deve ter no mínimo 8 caracteres")
        String novaSenha,

        @NotBlank(message = "A confirmação de senha é obrigatória")
        String confirmacaoSenha
) {}
