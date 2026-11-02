package io.github.gubiogarcia.plataforma_governanca_software.shared;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Montagem de CSV com ";" (padrão do Excel em pt-BR).
 *
 * Além das aspas da RFC 4180, neutraliza injeção de fórmulas (CWE-1236): um texto que
 * começa com =, +, -, @, tab ou CR recebe o prefixo ' e o Excel o mostra como texto.
 * Números (Number) saem como estão.
 */
public final class CsvUtil {

    public static final String BOM = "﻿";
    public static final String SEP = ";";

    private CsvUtil() {}

    public static String linha(Object... campos) {
        return Arrays.stream(campos).map(CsvUtil::campo).collect(Collectors.joining(SEP)) + "\r\n";
    }

    public static String campo(Object valor) {
        if (valor == null) return "";
        if (valor instanceof Number n) return n.toString();
        String v = valor.toString();
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) v = "'" + v;
        v = v.replace("\"", "\"\"");
        return (v.contains(SEP) || v.contains("\"") || v.contains("\n") || v.contains("\r")) ? "\"" + v + "\"" : v;
    }
}
