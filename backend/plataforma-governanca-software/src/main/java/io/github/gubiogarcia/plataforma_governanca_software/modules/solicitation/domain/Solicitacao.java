package io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Pedido de um stakeholder ao Dono/Gestor do projeto (D12): alteração, reprovação ou
 * aprovação de requisito, evento ou exportação. Atendida/recusada por quem tem
 * SOLICITACAO_RESPONDER; cancelável pelo próprio solicitante enquanto pendente.
 */
@Entity
@Table(name = "solicitacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solicitacao {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoSolicitacao tipo;

    /** Requisito ou evento alvo; nulo nas exportações. */
    @Column(name = "alvo_id")
    private UUID alvoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusSolicitacao status;

    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitante_id")
    private Usuario solicitante;

    @Column(length = 2000)
    private String justificativa;

    @ManyToOne
    @JoinColumn(name = "respondido_por")
    private Usuario respondidoPor;

    @Column(length = 2000)
    private String resposta;

    @Column(name = "data_criacao", nullable = false)
    private Instant dataCriacao;

    @Column(name = "data_resposta")
    private Instant dataResposta;
}
