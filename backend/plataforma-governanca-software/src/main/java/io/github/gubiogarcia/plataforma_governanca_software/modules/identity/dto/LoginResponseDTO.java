package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

public record LoginResponseDTO(
        String token,
        UsuarioResponseDTO user
) {}