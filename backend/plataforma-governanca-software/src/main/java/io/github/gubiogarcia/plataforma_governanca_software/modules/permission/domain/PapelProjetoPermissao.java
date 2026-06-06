package io.github.gubiogarcia.plataforma_governanca_software.modules.permission.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.PapelProjeto;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(
        name = "papel_projeto_permissao",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_papel_projeto_perm",
                        columnNames = {"papel_projeto_id", "permissao_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PapelProjetoPermissao {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "papel_projeto_id")
    private PapelProjeto papelProjeto;

    @ManyToOne
    @JoinColumn(name = "permissao_id")
    private Permissao permissao;
}