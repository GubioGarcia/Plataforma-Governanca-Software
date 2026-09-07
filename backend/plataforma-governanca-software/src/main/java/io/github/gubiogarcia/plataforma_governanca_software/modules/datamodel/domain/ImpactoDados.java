package io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Liga um Requisito a uma EntidadeDados/AtributoEntidade específico e guarda
 * o diff antes/depois (mesmo princípio já usado em Auditoria, aplicado ao
 * schema em vez de a um campo qualquer).
 * <p>
 * Também é a base do vínculo INDIRETO da matriz de rastreabilidade: dois
 * requisitos com ImpactoDados apontando para a mesma EntidadeDados ficam
 * automaticamente relacionados via JOIN entre dois registros de ImpactoDados
 * — não é uma tabela de vínculo à parte, é o resultado dessa consulta.
 */
@Entity
@Table(name = "impacto_dados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpactoDados {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisito_id", nullable = false)
    private Requisito requisito;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidade_id", nullable = false)
    private EntidadeDados entidade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atributo_id")
    private AtributoEntidade atributo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_operacao", nullable = false, length = 50)
    private TipoOperacaoImpacto tipoOperacao;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_novo", columnDefinition = "TEXT")
    private String valorNovo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por")
    private Usuario criadoPor;

    @Column(name = "data_criacao")
    private Instant dataCriacao;
}
