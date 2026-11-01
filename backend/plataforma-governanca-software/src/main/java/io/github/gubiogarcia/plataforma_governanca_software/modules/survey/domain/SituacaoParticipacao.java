package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

public enum SituacaoParticipacao {
    PARTICIPANDO("Participando"),
    RECUSOU("Recusou"),
    RETIRADA("Retirada");

    private final String rotulo;

    SituacaoParticipacao(String rotulo) { this.rotulo = rotulo; }

    public String rotulo() { return rotulo; }
}
