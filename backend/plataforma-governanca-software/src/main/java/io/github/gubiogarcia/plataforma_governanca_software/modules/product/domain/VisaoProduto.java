package io.github.gubiogarcia.plataforma_governanca_software.modules.product.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "visao_produto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisaoProduto {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @Column(name = "descricao_problema")
    private String descricaoProblema;

    @Column(name = "publico_alvo")
    private String publicoAlvo;

    @Column(name = "objetivo_geral")
    private String objetivoGeral;

    @Column(name = "objetivos_especificos")
    private String objetivosEspecificos;

    private String kpis;

    @Column(name = "restricoes_prazo")
    private String restricoesPrazo;

    @Column(name = "restricoes_orcamento")
    private String restricoesOrcamento;

    @Column(name = "tecnologias_obrigatorias")
    private String tecnologiasObrigatorias;

    private String regulamentacoes;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}