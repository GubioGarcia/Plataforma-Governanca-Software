package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Registra cada interação de um usuário em um módulo do projeto.
 * Uma interação é gerada automaticamente por qualquer ação de escrita:
 *   - criar / editar / excluir comentário
 *   - criar / editar / mudar status / aprovar / reprovar requisito
 *   - editar seção da WIKI
 *   - criar / editar / excluir evento
 *
 * Os dados são usados para calcular engajamento, participação e analytics sociais.
 */
@Entity
@Table(name = "interacao", indexes = {
    @Index(name = "idx_interacao_projeto", columnList = "projeto_id"),
    @Index(name = "idx_interacao_usuario_projeto", columnList = "usuario_id,projeto_id"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interacao {

    @Id
    @GeneratedValue
    private UUID id;

    /** Usuário que realizou a ação. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Projeto ao qual a ação pertence. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    /** Módulo onde a ação ocorreu. */
    @Enumerated(EnumType.STRING)
    @Column(name = "modulo", length = 20, nullable = false)
    private ModuloInteracao modulo;

    /** Tipo da ação. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", length = 20, nullable = false)
    private TipoInteracao tipo;

    /** UUID da entidade afetada (requisito, comentário, visão produto, evento). */
    @Column(name = "entidade_id")
    private UUID entidadeId;

    /** Breve descrição legível da ação (opcional). */
    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data_interacao", nullable = false)
    private Instant dataInteracao;
}
