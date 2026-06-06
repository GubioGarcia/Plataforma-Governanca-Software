package io.github.gubiogarcia.plataforma_governanca_software.modules.collaboration.dto;

import java.time.Instant;
import java.util.UUID;

public record ComentarioResponseDTO(
        UUID    id,
        String  conteudo,
        UUID    usuarioId,
        String  usuarioNome,
        String  usuarioAvatarUrl,
        String  entidadeTipo,
        UUID    entidadeId,
        UUID    organizacaoId,
        UUID    projetoId,
        Boolean ativo,
        Boolean editado,
        Instant dataCriacao,
        Instant dataAtualizacao
) {}
