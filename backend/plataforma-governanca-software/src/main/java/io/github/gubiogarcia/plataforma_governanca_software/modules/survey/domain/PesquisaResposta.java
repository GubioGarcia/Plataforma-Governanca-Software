package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** Resposta de uma etapa: os 5 itens (1 a 5) e a pergunta aberta opcional. Uma por etapa. */
@Entity
@Table(name = "pesquisa_resposta",
        uniqueConstraints = @UniqueConstraint(name = "uk_pesquisa_resposta_etapa", columnNames = {"participacao_id", "etapa"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PesquisaResposta {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participacao_id")
    private PesquisaParticipacao participacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EtapaPesquisa etapa;

    @Column(name = "item1", nullable = false) private Short item1;
    @Column(name = "item2", nullable = false) private Short item2;
    @Column(name = "item3", nullable = false) private Short item3;
    @Column(name = "item4", nullable = false) private Short item4;
    @Column(name = "item5", nullable = false) private Short item5;

    @Column(name = "resposta_aberta", length = 2000)
    private String respostaAberta;

    @Column(name = "respondida_em", nullable = false)
    private Instant respondidaEm;

    /** Os 5 itens em ordem (índice 0 = item 1). */
    public short[] itens() {
        return new short[]{item1, item2, item3, item4, item5};
    }
}
