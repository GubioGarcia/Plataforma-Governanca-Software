package io.github.gubiogarcia.plataforma_governanca_software.shared;

/**
 * Tentativa de renomear ou excluir um dado de referência de sistema (status
 * semeado pelas migrations e usado pelas regras de negócio pelo nome).
 */
public class DadoReferenciaSistemaException extends RuntimeException {
    public DadoReferenciaSistemaException(String tipo, String nome) {
        super("O " + tipo + " '" + nome + "' é usado pelas regras da plataforma: o nome não pode ser alterado "
                + "e o registro não pode ser excluído.");
    }
}
