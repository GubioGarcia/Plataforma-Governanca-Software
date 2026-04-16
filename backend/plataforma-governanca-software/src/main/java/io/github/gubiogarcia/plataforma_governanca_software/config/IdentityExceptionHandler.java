package io.github.gubiogarcia.plataforma_governanca_software.config;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminException;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.UsuarioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class IdentityExceptionHandler {

    @ExceptionHandler(JwtValidationException.class)
    public ProblemDetail handleJwtValidation(JwtValidationException ex) {
        log.warn("JWT inválido: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setTitle("Token inválido");
        problem.setDetail("O token JWT é inválido ou expirou. Faça login novamente.");
        problem.setType(URI.create("/errors/token-invalido"));
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problem.setTitle("Acesso negado");
        problem.setDetail("Você não tem permissão para acessar este recurso.");
        problem.setType(URI.create("/errors/acesso-negado"));
        return problem;
    }

    @ExceptionHandler(UsuarioService.EmailJaCadastradoException.class)
    public ProblemDetail handleEmailJaCadastrado(UsuarioService.EmailJaCadastradoException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("E-mail já cadastrado");
        problem.setDetail(ex.getMessage());
        problem.setType(URI.create("/errors/email-ja-cadastrado"));
        return problem;
    }

    @ExceptionHandler(UsuarioService.UsuarioNaoEncontradoException.class)
    public ProblemDetail handleUsuarioNaoEncontrado(UsuarioService.UsuarioNaoEncontradoException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Usuário não encontrado");
        problem.setDetail(ex.getMessage());
        problem.setType(URI.create("/errors/usuario-nao-encontrado"));
        return problem;
    }

    @ExceptionHandler(UsuarioService.CadastroKeycloakException.class)
    public ProblemDetail handleCadastroKeycloak(UsuarioService.CadastroKeycloakException ex) {
        log.error("Erro ao cadastrar usuário no Keycloak: {}", ex.getMessage(), ex.getCause());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_GATEWAY);
        problem.setTitle("Falha no servidor de autenticação");
        problem.setDetail(ex.getMessage());
        problem.setType(URI.create("/errors/keycloak-unavailable"));
        return problem;
    }

    @ExceptionHandler(KeycloakAdminException.class)
    public ProblemDetail handleKeycloakAdmin(KeycloakAdminException ex) {
        log.error("Keycloak Admin API retornou erro {}: {}", ex.getStatusCode(), ex.getMessage());
        int status = ex.getStatusCode() == 409 ? 409 : 502;
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setTitle("Erro no servidor de autenticação");
        problem.setDetail(ex.getStatusCode() == 409
                ? "Já existe um usuário com este e-mail no servidor de autenticação."
                : "Não foi possível se comunicar com o servidor de autenticação.");
        problem.setType(URI.create("/errors/keycloak-error"));
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detalhes = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        problem.setTitle("Dados inválidos");
        problem.setDetail(detalhes);
        problem.setType(URI.create("/errors/dados-invalidos"));
        return problem;
    }

    @ExceptionHandler(UsuarioService.UsuarioJaInativoException.class)
    public ProblemDetail handleUsuarioJaInativo(UsuarioService.UsuarioJaInativoException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Usuário já inativo");
        problem.setDetail(ex.getMessage());
        problem.setType(URI.create("/errors/usuario-ja-inativo"));
        return problem;
    }
}