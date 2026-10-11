package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organizacao {

    @Id
    @GeneratedValue
    private UUID id;

    private String nome;

    private String descricao;

    private String plano;

    private Boolean ativo;

    @Column(name = "criado_por")
    private UUID criadoPor;

    @Column(name = "data_criacao")
    private Instant dataCriacao;

    @Column(name = "data_atualizacao")
    private Instant dataAtualizacao;

    /** Id do grupo /org-{id} no Keycloak (pertencimento e papéis ficam nos subgrupos). */
    @Column(name = "keycloak_group_id")
    private UUID keycloakGroupId;
}