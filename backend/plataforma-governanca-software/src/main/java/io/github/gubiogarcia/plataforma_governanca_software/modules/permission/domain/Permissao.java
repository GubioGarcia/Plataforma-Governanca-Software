package io.github.gubiogarcia.plataforma_governanca_software.modules.permission.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "permissao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permissao {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String codigo;

    private String nome;

    private String descricao;

    @Column(name = "modulo_id")
    private UUID moduloId;
}
