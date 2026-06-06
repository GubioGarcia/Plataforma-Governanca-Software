package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

public record LoginRequestDTO(
        String email,
        String senha
) {}