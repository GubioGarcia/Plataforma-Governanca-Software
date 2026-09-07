package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import java.time.Instant;
import java.util.UUID;

public record EntidadeDadosResponseDTO(
        UUID id,
        UUID projetoId,
        String nome,
        String descricao,
        Boolean ativo,
        UUID criadoPorId,
        String criadoPorNome,
        Instant dataCriacao,
        Instant dataAtualizacao,
        long qtdAtributos,
        long qtdRequisitosImpactam
) {}
