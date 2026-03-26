package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.TipoRequisito;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "requisito")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requisito {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    private String titulo;

    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_requisito")
    private TipoRequisito tipoRequisito;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private StatusRequisito status;

    private Integer versao;

    @ManyToOne
    @JoinColumn(name = "prioridade_id")
    private Prioridade prioridade;

    @ManyToOne
    @JoinColumn(name = "criado_por")
    private Usuario criadoPor;

    @ManyToOne
    @JoinColumn(name = "aprovado_por")
    private Usuario aprovadoPor;

    @ManyToOne
    @JoinColumn(name = "solicitado_por")
    private Usuario solicitadoPor;

    private Boolean ativo;

    @Column(name = "data_criacao")
    private Instant dataCriacao;

    @Column(name = "data_solicitacao")
    private Instant dataSolicitacao;

    @Column(name = "data_aprovacao")
    private Instant dataAprovacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}