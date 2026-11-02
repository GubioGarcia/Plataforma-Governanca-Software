package io.github.gubiogarcia.plataforma_governanca_software.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CsvUtilTest {

    @Test
    void neutralizaTextoQueComecaComCaractereDeFormula() {
        assertThat(CsvUtil.campo("=1+1")).isEqualTo("'=1+1");
        assertThat(CsvUtil.campo("+cmd")).isEqualTo("'+cmd");
        assertThat(CsvUtil.campo("-2")).isEqualTo("'-2");
        assertThat(CsvUtil.campo("@SUM(A1:A2)")).isEqualTo("'@SUM(A1:A2)");
        assertThat(CsvUtil.campo("\t=x")).isEqualTo("'\t=x");
        assertThat(CsvUtil.campo("\r=x")).isEqualTo("\"'\r=x\"");
    }

    @Test
    void formulaComSeparadorOuAspasContinuaEntreAspas() {
        assertThat(CsvUtil.campo("=HYPERLINK(\"http://x\";\"clique\")"))
                .isEqualTo("\"'=HYPERLINK(\"\"http://x\"\";\"\"clique\"\")\"");
    }

    @Test
    void textoNormalENumerosSaemComoEstao() {
        assertThat(CsvUtil.campo("Requisito 1 = ok")).isEqualTo("Requisito 1 = ok");
        assertThat(CsvUtil.campo("")).isEmpty();
        assertThat(CsvUtil.campo(null)).isEmpty();
        assertThat(CsvUtil.campo(3)).isEqualTo("3");
        assertThat(CsvUtil.campo(-2)).isEqualTo("-2");
        assertThat(CsvUtil.campo("a;b")).isEqualTo("\"a;b\"");
        assertThat(CsvUtil.campo("diz \"oi\"")).isEqualTo("\"diz \"\"oi\"\"\"");
    }

    @Test
    void linhaJuntaComPontoEVirgulaETerminaComCrLf() {
        assertThat(CsvUtil.linha("a", 1, null, "=x")).isEqualTo("a;1;;'=x\r\n");
    }
}
