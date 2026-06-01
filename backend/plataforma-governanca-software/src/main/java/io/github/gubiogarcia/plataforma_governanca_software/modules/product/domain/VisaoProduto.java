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

    @Column(name = "descricao_problema", length = 1000)
    private String descricaoProblema;

    @Column(name = "publico_alvo", length = 1000)
    private String publicoAlvo;

    @Column(name = "objetivo_geral", length = 1000)
    private String objetivoGeral;

    @Column(name = "objetivos_especificos", length = 1000)
    private String objetivosEspecificos;

    @Column(length = 1000)
    private String kpis;

    @Column(name = "restricoes_prazo", length = 1000)
    private String restricoesPrazo;

    @Column(name = "restricoes_orcamento", length = 1000)
    private String restricoesOrcamento;

    @Column(name = "tecnologias_obrigatorias", length = 1000)
    private String tecnologiasObrigatorias;

    @Column(length = 1000)
    private String regulamentacoes;

    @Column(name = "data_criacao", updatable = false)
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;
}
