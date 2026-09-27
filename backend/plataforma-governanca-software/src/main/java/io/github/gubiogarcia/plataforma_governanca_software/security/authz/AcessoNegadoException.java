package io.github.gubiogarcia.plataforma_governanca_software.security.authz;

/** O usuário autenticado não tem a permissão exigida para a operação (HTTP 403). */
public class AcessoNegadoException extends RuntimeException {
    public AcessoNegadoException(String message) {
        super(message);
    }
}
