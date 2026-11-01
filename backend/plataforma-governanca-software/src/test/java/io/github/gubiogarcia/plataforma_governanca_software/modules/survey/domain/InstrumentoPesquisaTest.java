package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InstrumentoPesquisaTest {

    @Test
    void v1TemCincoItensNumeradosComTextoAntesEDepois() {
        var v1 = InstrumentoPesquisa.V1;
        assertThat(v1.versao()).isEqualTo("v1");
        assertThat(v1.itens()).hasSize(InstrumentoPesquisa.QUANTIDADE_ITENS);
        for (int i = 0; i < v1.itens().size(); i++) {
            var item = v1.itens().get(i);
            assertThat(item.numero()).isEqualTo(i + 1);
            assertThat(item.textoAntes()).isNotBlank();
            assertThat(item.textoDepois()).isNotBlank().isNotEqualTo(item.textoAntes());
        }
        assertThat(v1.escala()).containsExactly("Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente");
    }

    @Test
    void opcoesDeCaracterizacaoSaoOsValoresDosEnums() {
        var v1 = InstrumentoPesquisa.V1;
        assertThat(v1.funcoes()).extracting(InstrumentoPesquisa.Opcao::valor)
                .containsExactly("GERENTE_PROJETOS", "PRODUCT_OWNER", "ANALISTA_REQUISITOS", "DESENVOLVEDOR", "CLIENTE_STAKEHOLDER", "OUTRA");
        assertThat(v1.temposExperiencia()).extracting(InstrumentoPesquisa.Opcao::rotulo)
                .containsExactly("Até 5 anos", "6 a 10 anos", "11 a 15 anos", "Mais de 15 anos");
        assertThat(v1.ferramentas()).hasSize(Ferramenta.values().length)
                .extracting(InstrumentoPesquisa.Opcao::valor).endsWith("OUTRA");
        assertThat(InstrumentoPesquisa.vigente()).isSameAs(v1);
    }
}
