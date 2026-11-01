package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

/** Função atual do participante (caracterização da etapa "antes"). */
public enum FuncaoParticipante {
    GERENTE_PROJETOS("Gerente ou gestor de projetos"),
    PRODUCT_OWNER("Product Owner / Product Manager"),
    ANALISTA_REQUISITOS("Analista de requisitos ou de negócios"),
    DESENVOLVEDOR("Desenvolvedor(a)"),
    CLIENTE_STAKEHOLDER("Cliente ou stakeholder"),
    OUTRA("Outra");

    private final String rotulo;

    FuncaoParticipante(String rotulo) { this.rotulo = rotulo; }

    public String rotulo() { return rotulo; }
}
