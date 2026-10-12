package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Representa uma entidade/tabela de negócio do projeto sendo especificado
 * (ex: "Cliente", "Pedido") — não confundir com as tabelas físicas desta
 * plataforma (Usuario, Projeto etc.), que existem independente deste módulo.
 */
@Entity
@Table(
        name = "entidade_dados",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_entidade_dados_projeto_nome",
                columnNames = {"projeto_id", "nome"}
        )
)
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por")
    private Usuario criadoPor;

    private Boolean ativo;

    @Column(name = "data_criacao")
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}
