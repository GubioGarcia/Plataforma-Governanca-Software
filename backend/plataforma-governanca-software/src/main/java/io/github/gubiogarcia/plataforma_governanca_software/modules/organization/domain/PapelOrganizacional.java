package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "papel_organizacional")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PapelOrganizacional {

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