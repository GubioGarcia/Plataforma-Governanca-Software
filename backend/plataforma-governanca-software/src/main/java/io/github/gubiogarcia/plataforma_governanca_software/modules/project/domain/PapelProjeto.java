package io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "papel_projeto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PapelProjeto {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String codigo;

    private String nome;

    private String descricao;

    @Column(name = "nivel_hierarquia")
    private Integer nivelHierarquia;

    private Boolean ativo;
}