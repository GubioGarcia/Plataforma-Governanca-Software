package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain.TipoRelacionamentoEntidade;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AtualizarAtributoEntidadeRequestDTO(
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Size(max = 50, message = "Tipo deve ter no máximo 50 caracteres")
        String tipo,

        Boolean obrigatorio,

        Boolean chavePrimaria,

        Integer ordem,

        /** Marca o atributo como chave estrangeira — deriva um RelacionamentoEntidade automaticamente. */
        Boolean chaveEstrangeira,

        /** Entidade referenciada pela FK. Obrigatório quando {@code chaveEstrangeira} é {@code true}. */
        UUID entidadeReferenciadaId,

        /** Cardinalidade do relacionamento derivado. Default {@code UM_PARA_MUITOS} quando omitido. */
        TipoRelacionamentoEntidade tipoRelacionamento
) {}
