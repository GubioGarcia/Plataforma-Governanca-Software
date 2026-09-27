package io.github.gubiogarcia.plataforma_governanca_software.modules.membership.domain;

/**
 * Papel oferecido no convite.
 * Organização: GESTOR ou MEMBRO. Projeto: GESTOR ou STAKEHOLDER (técnico + cliente — D9).
 * Dono nunca é atribuível por convite (D3; _dono do projeto só para o criador).
 */
public enum PapelConvite {
    GESTOR,
    MEMBRO,
    STAKEHOLDER
}
