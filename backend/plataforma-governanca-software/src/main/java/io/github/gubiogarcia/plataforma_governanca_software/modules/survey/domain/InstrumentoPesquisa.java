package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

/**
 * Textos do questionário (fonte única: o backend entrega ao frontend e os apêndices
 * da monografia repetem estes textos). Uma versão publicada nunca muda: qualquer
 * alteração de texto cria a próxima (V2, ...) e passa a ser a vigente, e cada
 * participação guarda a versão que respondeu.
 */
public final class InstrumentoPesquisa {

    public static final int TAMANHO_MAXIMO_ABERTA = 2000;
    public static final int TAMANHO_MAXIMO_FERRAMENTA_OUTRO = 100;
    public static final int QUANTIDADE_ITENS = 5;

    public record Item(int numero, String textoAntes, String textoDepois) {}

    public record Etapa(String cabecalho, String instrucao, String perguntaAberta) {}

    public record Opcao(String valor, String rotulo) {}

    public record Versao(
            String versao,
            String tituloTermo,
            List<String> termo,
            String textoConcordo,
            List<String> escala,
            Etapa antes,
            Etapa depois,
            List<Item> itens,
            String perguntaFuncao,
            List<Opcao> funcoes,
            String perguntaTempoExperiencia,
            List<Opcao> temposExperiencia,
            String perguntaFerramentas,
            List<Opcao> ferramentas
    ) {}

    public static final Versao V1 = new Versao(
            "v1",
            "Pesquisa do TCC — Discovery Platform",
            List.of(
                    "Esta pesquisa faz parte do Trabalho de Conclusão de Curso de Engenharia de Software da Faculdade SENAI Fatesg. "
                            + "O objetivo é comparar como as fases de discovery e elicitação de requisitos são conduzidas hoje com a "
                            + "percepção sobre esta plataforma, depois de usá-la.",
                    "São duas etapas curtas, de cerca de 3 minutos cada: uma agora, antes de usar a plataforma, e outra depois. "
                            + "A participação é voluntária e pode ser interrompida a qualquer momento.",
                    "As respostas são analisadas de forma agregada e identificadas apenas por um código; seu nome e seu e-mail não "
                            + "aparecem nos resultados. Você pode retirar sua participação a qualquer momento em Meu Perfil, e suas "
                            + "respostas serão apagadas.",
                    "Nas respostas abertas, evite informar nomes de pessoas, de clientes ou dados confidenciais."),
            "Li e concordo em participar.",
            List.of("Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"),
            new Etapa(
                    "Antes de começar, conte como é hoje a fase inicial dos seus projetos.",
                    "Pense nos projetos de software em que você atuou recentemente e indique o quanto concorda com cada afirmação.",
                    "Descreva uma situação recente em que a forma como as informações ou as decisões das fases iniciais foram "
                            + "registradas ou comunicadas causou retrabalho ou desalinhamento com os stakeholders."),
            new Etapa(
                    "Nos ajude a melhorar: agora, avalie a plataforma.",
                    "Considerando o uso da plataforma no cenário apresentado, indique o quanto concorda com cada afirmação.",
                    "Quais recursos da plataforma mais contribuiriam para o seu trabalho nas fases iniciais de um projeto, e o que "
                            + "você mudaria ou acrescentaria?"),
            List.of(
                    new Item(1,
                            "As informações das fases iniciais do projeto (visão do produto, requisitos, decisões, reuniões e arquivos) "
                                    + "ficam reunidas em um único lugar, acessível a todos os envolvidos.",
                            "Na plataforma, as informações das fases iniciais do projeto (visão do produto, requisitos, decisões, "
                                    + "eventos e arquivos) ficam reunidas em um único lugar, acessível a todos os envolvidos."),
                    new Item(2,
                            "Os stakeholders (clientes e usuários) participam de forma contínua da discussão e da validação dos "
                                    + "requisitos, e não apenas em reuniões pontuais.",
                            "A plataforma permite que os stakeholders participem de forma contínua da discussão e da validação dos "
                                    + "requisitos."),
                    new Item(3,
                            "Quando um stakeholder pede a aprovação, a alteração ou a reprovação de um requisito, existe um canal "
                                    + "formal em que o pedido, a justificativa e a resposta do gestor ficam registrados.",
                            "A plataforma oferece um canal formal em que os pedidos de aprovação, alteração ou reprovação de "
                                    + "requisitos, a justificativa e a resposta do gestor ficam registrados."),
                    new Item(4,
                            "É fácil identificar quem aprovou cada requisito, quando isso aconteceu e quais alterações ele sofreu ao "
                                    + "longo do projeto.",
                            "Na plataforma, é fácil identificar quem aprovou cada requisito, quando isso aconteceu e quais alterações "
                                    + "ele sofreu."),
                    new Item(5,
                            "Quando um requisito muda, é fácil identificar quais outros requisitos e quais dados do sistema "
                                    + "(entidades e atributos) são afetados.",
                            "Com a matriz de rastreabilidade e a modelagem de dados, é fácil identificar quais outros requisitos e "
                                    + "quais dados do sistema são afetados quando um requisito muda.")),
            "Função atual",
            opcoes(FuncaoParticipante.values(), FuncaoParticipante::rotulo),
            "Tempo de experiência com projetos de software",
            opcoes(TempoExperiencia.values(), TempoExperiencia::rotulo),
            "Ferramentas que você usa hoje para registrar e discutir requisitos (marque todas)",
            opcoes(Ferramenta.values(), Ferramenta::rotulo));

    private InstrumentoPesquisa() {}

    /** Versão aplicada às novas participações. */
    public static Versao vigente() {
        return V1;
    }

    private static <E extends Enum<E>> List<Opcao> opcoes(E[] valores, Function<E, String> rotulo) {
        return Arrays.stream(valores).map(e -> new Opcao(e.name(), rotulo.apply(e))).toList();
    }
}
