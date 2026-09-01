package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Auto-relacionamento N:N em EntidadeDados — representa a FK entre duas
 * entidades de negócio do projeto (ex: Pedido -> Cliente). Base de dados
 * já deixada pronta para a rastreabilidade indireta via cadeia de FKs,
 * ainda não implementada nesta versão.
 */
@Entity
@Table(
        name = "relacionamento_entidade",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_relacionamento_entidade",
                columnNames = {"entidade_origem_id", "entidade_destino_id", "tipo"}
        )
)
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
}
