package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto;

import java.time.Instant;
import java.util.List;

/**
 * Painel da pesquisa (Admin da Plataforma): estado da coleta, contagens, estatística
 * descritiva por item e caracterização. Nada identifica os participantes.
 */
public record ResumoPesquisaDTO(
        boolean coletaAberta,
        Instant abertaEm,
        Instant encerradaEm,
        int intervaloMinimoMin,
        long participantes,
        long retiradas,
        long antesRespondidos,
        long depoisRespondidos,
        long paresCompletos,
        /** Participações ativas que responderam o "antes" já com uso da plataforma; sempre sobre o total. */
        long antesComUsoPrevio,
        /** Se itens e caracterização desconsideram as participações com uso prévio. */
        boolean filtroUsoPrevioAplicado,
        List<Item> itens,
        List<Contagem> funcoes,
        List<Contagem> temposExperiencia,
        List<Contagem> ferramentas
) {
    public record Item(int numero, String textoAntes, String textoDepois,
                       Distribuicao antes, Distribuicao depois, Pareado pareado) {}

    /** distribuicao[0] = quantos marcaram 1, ..., distribuicao[4] = quantos marcaram 5. Mediana nula sem respostas. */
    public record Distribuicao(int n, List<Integer> distribuicao, Double mediana) {}

    /** Só quem respondeu as duas etapas; diferença = depois - antes. */
    public record Pareado(int n, Double medianaDiferenca, int melhoraram, int iguais, int pioraram) {}

    public record Contagem(String valor, String rotulo, long quantidade) {}
}
