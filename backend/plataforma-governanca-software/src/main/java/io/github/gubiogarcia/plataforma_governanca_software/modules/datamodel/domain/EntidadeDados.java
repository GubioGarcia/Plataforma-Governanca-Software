package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Representa uma entidade/tabela de negócio do projeto sendo especificado
 * (ex: "Cliente", "Pedido") — não confundir com as tabelas físicas desta
 * plataforma (Usuario, Projeto etc.), que existem independente deste módulo.
 */
@Entity
@Table(name = "entidade_dados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntidadeDados {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;
}
