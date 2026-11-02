package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Participação de um usuário na pesquisa (no máximo uma por usuário). O código
 * (P-001, ...) é a única identificação que sai do banco; a retirada fica sem
 * código e sem caracterização.
 */
@Entity
@Table(name = "pesquisa_participacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PesquisaParticipacao {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SituacaoParticipacao situacao;

    @Column(length = 10, unique = true)
    private String codigo;

    @Column(name = "versao_instrumento", nullable = false, length = 10)
    private String versaoInstrumento;

    @Column(name = "consentimento_em")
    private Instant consentimentoEm;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private FuncaoParticipante funcao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tempo_experiencia", length = 20)
    private TempoExperiencia tempoExperiencia;

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "pesquisa_participacao_ferramenta", joinColumns = @JoinColumn(name = "participacao_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "ferramenta", nullable = false, length = 30)
    private Set<Ferramenta> ferramentas = new HashSet<>();

    @Column(name = "ferramenta_outro", length = 100)
    private String ferramentaOutro;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;
}
