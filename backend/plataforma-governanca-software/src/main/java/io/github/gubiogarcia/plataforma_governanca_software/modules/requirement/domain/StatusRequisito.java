package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "status_requisito")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusRequisito {

    @Id
    @GeneratedValue
    private UUID id;

    private String nome;

    private String descricao;

    private Integer ordem;

    /** Status usado pelas regras da plataforma: nome fixo e exclusão bloqueada. */
    @Builder.Default
    @Column(nullable = false)
    private Boolean sistema = false;
}