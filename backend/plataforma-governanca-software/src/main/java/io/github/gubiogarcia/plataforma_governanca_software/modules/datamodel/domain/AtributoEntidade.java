package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Atributo/coluna de uma EntidadeDados (ex: entidade "Cliente", atributo "cpf").
 */
@Entity
@Table(
        name = "atributo_entidade",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_atributo_entidade_entidade_nome",
                columnNames = {"entidade_id", "nome"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtributoEntidade {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidade_id", nullable = false)
    private EntidadeDados entidade;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false)
    private Boolean obrigatorio;

    /** Ordem de exibição da coluna no diagrama ER (menor = primeiro). */
    private Integer ordem;
}
