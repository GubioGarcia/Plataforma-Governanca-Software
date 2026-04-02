package io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra;

//Lançada quando o Keycloak Admin retorna um erro durante operações administrativas.
public class KeycloakAdminException extends RuntimeException {

    private final int statusCode;

    public KeycloakAdminException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public KeycloakAdminException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}