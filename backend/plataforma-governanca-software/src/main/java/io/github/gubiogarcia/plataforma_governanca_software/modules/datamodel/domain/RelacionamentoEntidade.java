package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Auto-relacionamento N:N em EntidadeDados — representa a FK entre duas
 * entidades de negócio do projeto (ex: Pedido -> Cliente). Cada linha é
 * derivada de um {@link AtributoEntidade} marcado como chave estrangeira
 * ({@code atributoFk}, único) e mantida automaticamente por
 * {@code AtributoEntidadeService}; o CRUD manual continua disponível para
 * casos sem um atributo físico correspondente.
 */
@Entity
@Table(name = "relacionamento_entidade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelacionamentoEntidade {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidade_origem_id", nullable = false)
    private EntidadeDados entidadeOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidade_destino_id", nullable = false)
    private EntidadeDados entidadeDestino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoRelacionamentoEntidade tipo;

    /** Atributo da entidade de origem que materializa a FK (ex.: {@code cliente_id}). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atributo_fk_id", unique = true)
    private AtributoEntidade atributoFk;
}
