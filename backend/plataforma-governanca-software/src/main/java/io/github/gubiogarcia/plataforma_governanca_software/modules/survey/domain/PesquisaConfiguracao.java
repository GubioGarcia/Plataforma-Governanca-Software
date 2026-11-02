package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Estado da coleta (linha única, id = 1). Alterado só pelo Admin da Plataforma. */
@Entity
@Table(name = "pesquisa_configuracao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PesquisaConfiguracao {

    public static final short ID = 1;

    @Id
    private Short id;

    @Column(name = "coleta_aberta", nullable = false)
    private Boolean coletaAberta;

    /** Minutos entre o "antes" e a liberação do "depois". */
    @Column(name = "intervalo_minimo_min", nullable = false)
    private Integer intervaloMinimoMin;

    @Column(name = "aberta_em")
    private Instant abertaEm;

    @Column(name = "encerrada_em")
    private Instant encerradaEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por")
    private Usuario atualizadoPor;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;
}
