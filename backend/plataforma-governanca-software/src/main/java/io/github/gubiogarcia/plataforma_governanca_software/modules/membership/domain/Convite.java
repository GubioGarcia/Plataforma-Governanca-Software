package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Convite para participar de uma organização (projeto nulo) ou de um único projeto.
 * A inclusão no grupo do Keycloak só acontece quando o convidado aceita (Passo 4).
 */
@Entity
@Table(name = "convite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Convite {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String email;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizacao_id")
    private Organizacao organizacao;

    /** Nulo = convite para a organização inteira; preenchido = acesso só a este projeto. */
    @ManyToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PapelConvite papel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusConvite status;

    @ManyToOne
    @JoinColumn(name = "convidado_por")
    private Usuario convidadoPor;

    @Column(name = "data_criacao", nullable = false)
    private Instant dataCriacao;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "data_resposta")
    private Instant dataResposta;
}
