package io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de resposta da Wiki / Visao do Produto.
 * Inclui campos do Projeto (nome, descricao, criado_por, datas) conforme exibido no protótipo.
 */
public record VisaoProdutoResponseDTO(
        UUID id,
        UUID projetoId,
        String projetoNome,
        String projetoDescricao,
        UUID projetoCriadoPorId,
        String projetoCriadoPorNome,
        String projetoStatus,
        Instant projetoDataCriacao,
        Instant projetoDataAtualizacao,
        String descricaoProblema,
        String publicoAlvo,
        String objetivoGeral,
        String objetivosEspecificos,
        String kpis,
        String restricoesPrazo,
        String restricoesOrcamento,
        String tecnologiasObrigatorias,
        String regulamentacoes,
        Instant dataCriacao,
        Instant dataAtualizacao
) {}
