package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.dto;

import java.util.List;
import java.util.UUID;

/**
 * Pessoa com vínculo numa organização ou projeto.
 * vinculos: cada papel e de onde ele vem — ORGANIZACAO (herdado) ou PROJETO (direto).
 */
public record ParticipanteDTO(
        UUID usuarioId,
        String nome,
        String email,
        String urlMidiaPerfil,
        List<Vinculo> vinculos
) {
    public record Vinculo(String papel, String origem) {}
}
