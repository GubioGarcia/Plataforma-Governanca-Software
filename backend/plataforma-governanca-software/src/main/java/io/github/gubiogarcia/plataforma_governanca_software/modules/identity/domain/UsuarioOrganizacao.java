package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.PapelOrganizacional;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "usuario_organizacao",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_usuario_organizacao",
                        columnNames = {"usuario_id", "organizacao_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioOrganizacao {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "organizacao_id")
    private Organizacao organizacao;

    @ManyToOne
    @JoinColumn(name = "papel_organizacional_id")
    private PapelOrganizacional papelOrganizacional;

    private Boolean ativo;

    @Column(name = "data_entrada")
    private Instant dataEntrada;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}