package io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "status_projeto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusProjeto {

    @Id
    @GeneratedValue
    private UUID id;

    private String nome;

    private String descricao;

    private Integer ordem;
}
