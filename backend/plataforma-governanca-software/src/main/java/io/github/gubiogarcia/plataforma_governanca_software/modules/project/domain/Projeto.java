package io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "projeto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projeto {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "organizacao_id")
    private Organizacao organizacao;

    private String nome;

    private String descricao;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private StatusProjeto status;

    private Boolean ativo;

    @ManyToOne
    @JoinColumn(name = "criado_por")
    private Usuario criadoPor;

    @Column(name = "data_criacao")
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}
