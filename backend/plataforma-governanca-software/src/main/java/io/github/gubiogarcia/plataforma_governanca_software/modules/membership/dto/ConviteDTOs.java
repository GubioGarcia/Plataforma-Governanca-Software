package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.PapelConvite;
import io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain.StatusConvite;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

/** DTOs dos convites. */
public final class ConviteDTOs {

    private ConviteDTOs() {}

    public record CriarConviteRequestDTO(
            @NotBlank(message = "O e-mail é obrigatório.")
            @Email(message = "E-mail inválido.")
            String email,

            @NotNull(message = "O papel é obrigatório.")
            PapelConvite papel
    ) {}

    public record ConviteResponseDTO(
            UUID id,
            String email,
            UUID organizacaoId,
            String organizacaoNome,
            UUID projetoId,
            String projetoNome,
            PapelConvite papel,
            StatusConvite status,
            String convidadoPorNome,
            Instant dataCriacao,
            Instant expiraEm
    ) {}
}
