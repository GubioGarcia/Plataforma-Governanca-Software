package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "criterio_aceite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriterioAceite {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por", nullable = false)
    private Usuario criadoPor;

    @Column(name = "data_criacao", nullable = false)
    private Instant dataCriacao;

    @Column(name = "data_atualizacao", nullable = false)
    private Instant dataAtualizacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisito_id", nullable = false)
    private Requisito requisito;
}
