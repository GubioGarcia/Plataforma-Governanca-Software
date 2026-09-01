package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain;

/**
 * Classificação de como dois requisitos se relacionam na matriz de
 * rastreabilidade:
 * <ul>
 *   <li>{@code DIRETO}   — existe um VinculoRequisito explícito entre eles;</li>
 *   <li>{@code INDIRETO} — compartilham ao menos uma EntidadeDados via ImpactoDados;</li>
 *   <li>{@code MISTO}    — as duas situações ao mesmo tempo.</li>
 * </ul>
 * Usado apenas nos DTOs de resposta da matriz/análise de impacto.
 */
public enum TipoRelacaoMatriz {
    DIRETO,
    INDIRETO,
    MISTO
}
