package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.dto;

import java.util.List;
import java.util.UUID;

public record KeycloakUserInfo (
        UUID keycloakId,
        String email,
        String nome,
        List<String> roles
) {}
