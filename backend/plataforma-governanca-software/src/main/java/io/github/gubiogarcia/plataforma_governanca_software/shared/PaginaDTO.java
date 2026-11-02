package io.github.gubiogarcia.plataforma_governanca_software.shared;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Página de resultados (número a partir de 0). */
public record PaginaDTO<T>(
        List<T> itens,
        int     pagina,
        int     tamanho,
        long    total,
        int     totalPaginas
) {
    public static <E, T> PaginaDTO<T> de(Page<E> page, Function<E, T> mapear) {
        return new PaginaDTO<>(page.getContent().stream().map(mapear).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
