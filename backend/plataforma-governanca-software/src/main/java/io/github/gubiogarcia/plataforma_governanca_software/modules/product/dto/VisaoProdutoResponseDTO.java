package io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de resposta da Wiki / Visao do Produto.
 * Inclui campos do Projeto (nome, descricao, criado_por) conforme exibido no prototipo.
 */
public record VisaoProdutoResponseDTO(
        UUID id,
        UUID projetoId,
        String projetoNome,
        String projetoDescricao,
        UUID projetoCriadoPorId,
        String projetoCriadoPorNome,
        String projetoStatus,
        String descricaoProblema,
        String publicoAlvo,
        String objetivoGeral,
        String objetivosEspecificos,
        String kpis,
        String restricoesPrazo,
        String restricoesOrcamento,
        String tecnologiasObrigatorias,
        String regulamentacoes,
        Instant dataAtualizacao
) {}