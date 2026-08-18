package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Auto-relacionamento N:N em Requisito. É a camada de vínculo DIRETO da
 * matriz de rastreabilidade — criado manualmente pelo usuário na tela do
 * requisito.
 */
@Entity
@Table(name = "vinculo_requisito")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VinculoRequisito {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisito_origem_id", nullable = false)
    private Requisito requisitoOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisito_destino_id", nullable = false)
    private Requisito requisitoDestino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoVinculoRequisito tipo;
}
