package io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto;

import java.time.Instant;
import java.util.UUID;

/** Conta na lista da área administrativa. */
public record UsuarioAdminDTO(
        UUID    id,
        String  nome,
        String  email,
        Boolean ativo,
        Instant dataCriacao,
        /** Conta de Admin da Plataforma (grupo /_admin). */
        boolean adminPlataforma,
        /** A conta de quem está consultando (a tela não oferece inativá-la). */
        boolean propria
) {}
