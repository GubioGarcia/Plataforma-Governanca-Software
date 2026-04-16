package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.PapelProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "usuario_projeto",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_usuario_projeto",
                        columnNames = {"usuario_id","projeto_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioProjeto {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "papel_projeto_id")
    private PapelProjeto papelProjeto;

    private Boolean ativo;

    @Column(name = "data_entrada")
    private Instant dataEntrada;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}