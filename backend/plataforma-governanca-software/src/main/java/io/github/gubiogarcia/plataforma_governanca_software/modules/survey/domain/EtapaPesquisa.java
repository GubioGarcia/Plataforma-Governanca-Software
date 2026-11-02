package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

public enum EtapaPesquisa {
    ANTES("Antes do uso"),
    DEPOIS("Depois do uso");

    private final String rotulo;

    EtapaPesquisa(String rotulo) { this.rotulo = rotulo; }

    public String rotulo() { return rotulo; }
}
