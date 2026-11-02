package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

/** Estado do usuário na pesquisa, que decide o que o frontend mostra (ver PesquisaService). */
public enum EstadoPesquisa {
    NAO_ELEGIVEL,
    PENDENTE_ANTES,
    AGUARDANDO_DEPOIS,
    PENDENTE_DEPOIS,
    CONCLUIDA,
    RECUSOU,
    RETIRADA
}
