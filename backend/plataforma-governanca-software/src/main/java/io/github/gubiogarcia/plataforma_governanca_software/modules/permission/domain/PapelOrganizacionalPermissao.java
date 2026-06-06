package io.github.gubiogarcia.plataforma_governanca_software.modules.permission.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.PapelOrganizacional;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(
        name = "papel_organizacional_permissao",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_papel_perm",
                        columnNames = {"papel_organizacional_id", "permissao_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PapelOrganizacionalPermissao {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "papel_organizacional_id")
    private PapelOrganizacional papelOrganizacional;

    @ManyToOne
    @JoinColumn(name = "permissao_id")
    private Permissao permissao;
}