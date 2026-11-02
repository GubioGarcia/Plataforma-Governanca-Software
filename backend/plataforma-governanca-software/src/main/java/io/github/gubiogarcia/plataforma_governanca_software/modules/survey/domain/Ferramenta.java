package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

/** Ferramentas usadas hoje para registrar e discutir requisitos. OUTRA vem com o texto em ferramentaOutro. */
public enum Ferramenta {
    JIRA("Jira"),
    CONFLUENCE("Confluence"),
    AZURE_DEVOPS("Azure DevOps"),
    JAMA_CONNECT("Jama Connect"),
    IBM_DOORS("IBM DOORS"),
    PRODUCTBOARD("Productboard"),
    PLANILHAS_DOCUMENTOS("Planilhas ou documentos de texto"),
    EMAIL_MENSAGENS("E-mail ou aplicativos de mensagem"),
    OUTRA("Outra");

    private final String rotulo;

    Ferramenta(String rotulo) { this.rotulo = rotulo; }

    public String rotulo() { return rotulo; }
}
