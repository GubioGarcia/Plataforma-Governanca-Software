package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UsuarioResponseDTO (
        UUID id,
        UUID externalIdentityId,
        String nome,
        String email,
        Boolean ativo,
        Instant dataCriacao,
        String urlMidiaPerfil,
        List<String> roles
) {}
