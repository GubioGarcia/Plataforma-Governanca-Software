package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "external_identity_id", unique = true)
    private UUID externalIdentityId;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    private Boolean ativo;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;

    @Column(name = "url_midia_perfil")
    private String urlMidiaPerfil;

    /**
     * Tokens emitidos antes deste instante são recusados (401) — gravado sempre que os
     * grupos do usuário mudam, para que a próxima requisição force a renovação da sessão.
     */
    @Column(name = "tokens_revogados_antes_de")
    private Instant tokensRevogadosAntesDe;
}