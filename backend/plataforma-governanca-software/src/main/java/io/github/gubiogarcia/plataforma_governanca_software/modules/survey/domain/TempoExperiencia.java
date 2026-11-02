package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

/** Tempo de experiência com projetos de software (caracterização da etapa "antes"). */
public enum TempoExperiencia {
    ATE_5("Até 5 anos"),
    DE_6_A_10("6 a 10 anos"),
    DE_11_A_15("11 a 15 anos"),
    MAIS_DE_15("Mais de 15 anos");

    private final String rotulo;

    TempoExperiencia(String rotulo) { this.rotulo = rotulo; }

    public String rotulo() { return rotulo; }
}
