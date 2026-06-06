package io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Registra toda alteração realizada em qualquer entidade do sistema.
 * Cada linha representa uma mudança em um único campo de uma entidade.
 *
 * Exemplo:
 *   entidadeTipo  = "REQUISITO"
 *   entidadeId    = <uuid do requisito>
 *   campoAlterado = "titulo"
 *   valorAnterior = "Login e autenticação"
 *   valorNovo     = "Autenticação de usuários"
 */
@Entity
@Table(name = "auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auditoria {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizacao_id")
    private Organizacao organizacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    /** Tipo da entidade auditada: REQUISITO, WIKI, PROJETO, etc. */
    @Column(name = "entidade_tipo", length = 50)
    private String entidadeTipo;

    /** PK da entidade auditada. */
    @Column(name = "entidade_id")
    private UUID entidadeId;

    /**
     * Tipo de operação que gerou este registro.
     * Gravado como String (VARCHAR) no banco para legibilidade direta nas consultas SQL.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "acao", length = 20, nullable = false)
    private AcaoAuditoria acao;

    /** Nome do campo que foi alterado (ex.: "titulo", "descricao", "status"). */
    @Column(name = "campo_alterado", length = 100)
    private String campoAlterado;

    /** Valor do campo antes da alteração (null para criações). */
    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    /** Valor do campo após a alteração. */
    @Column(name = "valor_novo", columnDefinition = "TEXT")
    private String valorNovo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "data_alteracao")
    private Instant dataAlteracao;
}
