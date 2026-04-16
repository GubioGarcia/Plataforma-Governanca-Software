package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "prioridade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prioridade {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String codigo;

    private String nome;

    private String descricao;

    private Integer ordem;

    private Boolean ativo;
}
