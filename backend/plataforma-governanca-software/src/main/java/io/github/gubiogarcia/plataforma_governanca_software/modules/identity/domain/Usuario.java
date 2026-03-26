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

    @Column(name = "external_identity_id")
    private UUID externalIdentityId;

    private String nome;

    @Column(unique = true)
    private String email;

    private Boolean ativo;

    @Column(name = "data_criacao")
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;

    @Column(name = "url_midia_perfil")
    private String urlMidiaPerfil;
}