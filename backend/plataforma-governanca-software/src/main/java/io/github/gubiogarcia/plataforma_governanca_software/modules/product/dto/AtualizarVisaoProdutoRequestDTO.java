package io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto;

import jakarta.validation.constraints.Size;

public record AtualizarVisaoProdutoRequestDTO(

        @Size(max = 1000, message = "Descrição do problema deve ter no máximo 1000 caracteres")
        String descricaoProblema,

        @Size(max = 1000, message = "Público-alvo deve ter no máximo 1000 caracteres")
        String publicoAlvo,

        @Size(max = 1000, message = "Objetivo geral deve ter no máximo 1000 caracteres")
        String objetivoGeral,

        @Size(max = 1000, message = "Objetivos específicos devem ter no máximo 1000 caracteres")
        String objetivosEspecificos,

        @Size(max = 1000, message = "KPIs devem ter no máximo 1000 caracteres")
        String kpis,

        @Size(max = 1000, message = "Restrições de prazo devem ter no máximo 1000 caracteres")
        String restricoesPrazo,

        @Size(max = 1000, message = "Restrições de orçamento devem ter no máximo 1000 caracteres")
        String restricoesOrcamento,

        @Size(max = 1000, message = "Tecnologias obrigatórias devem ter no máximo 1000 caracteres")
        String tecnologiasObrigatorias,

        @Size(max = 1000, message = "Regulamentações devem ter no máximo 1000 caracteres")
        String regulamentacoes
) {}
