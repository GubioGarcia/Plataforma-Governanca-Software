package io.github.gubiogarcia.plataforma_governanca_software.config;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.infra.KeycloakAdminException;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.UsuarioService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service.OrganizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.service.VisaoProdutoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.EventoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.ProjetoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.StatusProjetoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.PrioridadeService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.StatusRequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.CriterioAceiteService;
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
public class GlobalExceptionHandler {

    // Seguranca / Autenticacao
    @ExceptionHandler(JwtValidationException.class)
    public ProblemDetail handleJwtValidation(JwtValidationException ex) {
        log.warn("JWT invalido: {}", ex.getMessage());
        return problem(HttpStatus.UNAUTHORIZED, "Token invalido",
                "O token JWT e invalido ou expirou. Faca login novamente.", "/errors/token-invalido");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        return problem(HttpStatus.FORBIDDEN, "Acesso negado",
                "Voce nao tem permissao para acessar este recurso.", "/errors/acesso-negado");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detalhes = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Dados invalidos", detalhes, "/errors/dados-invalidos");
    }

    // Identity / Usuario
    @ExceptionHandler(UsuarioService.EmailJaCadastradoException.class)
    public ProblemDetail handleEmailJaCadastrado(UsuarioService.EmailJaCadastradoException ex) {
        return problem(HttpStatus.CONFLICT, "E-mail ja cadastrado", ex.getMessage(), "/errors/email-ja-cadastrado");
    }

    @ExceptionHandler(UsuarioService.UsuarioNaoEncontradoException.class)
    public ProblemDetail handleUsuarioNaoEncontrado(UsuarioService.UsuarioNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Usuario nao encontrado", ex.getMessage(), "/errors/usuario-nao-encontrado");
    }

    @ExceptionHandler(UsuarioService.CadastroKeycloakException.class)
    public ProblemDetail handleCadastroKeycloak(UsuarioService.CadastroKeycloakException ex) {
        log.error("Erro ao cadastrar usuario no Keycloak: {}", ex.getMessage(), ex.getCause());
        return problem(HttpStatus.BAD_GATEWAY, "Falha no servidor de autenticacao", ex.getMessage(), "/errors/keycloak-unavailable");
    }

    @ExceptionHandler(UsuarioService.UsuarioJaInativoException.class)
    public ProblemDetail handleUsuarioJaInativo(UsuarioService.UsuarioJaInativoException ex) {
        return problem(HttpStatus.CONFLICT, "Usuario ja inativo", ex.getMessage(), "/errors/usuario-ja-inativo");
    }

    @ExceptionHandler(KeycloakAdminException.class)
    public ProblemDetail handleKeycloakAdmin(KeycloakAdminException ex) {
        log.error("Keycloak Admin API retornou erro {}: {}", ex.getStatusCode(), ex.getMessage());
        int status = ex.getStatusCode() == 409 ? 409 : 502;
        String detail = ex.getStatusCode() == 409
                ? "Ja existe um usuario com este e-mail no servidor de autenticacao."
                : "Nao foi possivel se comunicar com o servidor de autenticacao.";
        return problem(HttpStatus.valueOf(status), "Erro no servidor de autenticacao", detail, "/errors/keycloak-error");
    }

    // Organizacao
    @ExceptionHandler(OrganizacaoService.OrganizacaoNaoEncontradaException.class)
    public ProblemDetail handleOrganizacaoNaoEncontrada(OrganizacaoService.OrganizacaoNaoEncontradaException ex) {
        return problem(HttpStatus.NOT_FOUND, "Organizacao nao encontrada", ex.getMessage(), "/errors/organizacao-nao-encontrada");
    }

    @ExceptionHandler(OrganizacaoService.OrganizacaoNomeJaExisteException.class)
    public ProblemDetail handleOrganizacaoNomeJaExiste(OrganizacaoService.OrganizacaoNomeJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Nome de organizacao ja existe", ex.getMessage(), "/errors/organizacao-nome-ja-existe");
    }

    @ExceptionHandler(OrganizacaoService.OrganizacaoJaInativaException.class)
    public ProblemDetail handleOrganizacaoJaInativa(OrganizacaoService.OrganizacaoJaInativaException ex) {
        return problem(HttpStatus.CONFLICT, "Organizacao ja inativa", ex.getMessage(), "/errors/organizacao-ja-inativa");
    }

    @ExceptionHandler(OrganizacaoService.OrganizacaoInativaException.class)
    public ProblemDetail handleOrganizacaoInativa(OrganizacaoService.OrganizacaoInativaException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Organizacao inativa", ex.getMessage(), "/errors/organizacao-inativa");
    }

    @ExceptionHandler(OrganizacaoService.UsuarioNaoAutorizadoException.class)
    public ProblemDetail handleUsuarioNaoAutorizadoOrg(OrganizacaoService.UsuarioNaoAutorizadoException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Usuario nao autorizado", ex.getMessage(), "/errors/usuario-nao-autorizado");
    }

    // Projeto
    @ExceptionHandler(ProjetoService.ProjetoNaoEncontradoException.class)
    public ProblemDetail handleProjetoNaoEncontrado(ProjetoService.ProjetoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Projeto nao encontrado", ex.getMessage(), "/errors/projeto-nao-encontrado");
    }

    @ExceptionHandler(ProjetoService.ProjetoNomeJaExisteNaOrganizacaoException.class)
    public ProblemDetail handleProjetoNomeJaExiste(ProjetoService.ProjetoNomeJaExisteNaOrganizacaoException ex) {
        return problem(HttpStatus.CONFLICT, "Nome de projeto ja existe", ex.getMessage(), "/errors/projeto-nome-ja-existe");
    }

    @ExceptionHandler(ProjetoService.ProjetoJaInativoException.class)
    public ProblemDetail handleProjetoJaInativo(ProjetoService.ProjetoJaInativoException ex) {
        return problem(HttpStatus.CONFLICT, "Projeto ja inativo", ex.getMessage(), "/errors/projeto-ja-inativo");
    }

    @ExceptionHandler(ProjetoService.ProjetoInativoException.class)
    public ProblemDetail handleProjetoInativo(ProjetoService.ProjetoInativoException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Projeto inativo", ex.getMessage(), "/errors/projeto-inativo");
    }

    @ExceptionHandler(ProjetoService.OrganizacaoNaoEncontradaException.class)
    public ProblemDetail handleOrgNaoEncontradaViaProjeto(ProjetoService.OrganizacaoNaoEncontradaException ex) {
        return problem(HttpStatus.NOT_FOUND, "Organizacao nao encontrada", ex.getMessage(), "/errors/organizacao-nao-encontrada");
    }

    @ExceptionHandler(ProjetoService.OrganizacaoInativaException.class)
    public ProblemDetail handleOrgInativaViaProjeto(ProjetoService.OrganizacaoInativaException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Organizacao inativa", ex.getMessage(), "/errors/organizacao-inativa");
    }

    @ExceptionHandler(ProjetoService.UsuarioNaoAutorizadoException.class)
    public ProblemDetail handleUsuarioNaoAutorizadoProjeto(ProjetoService.UsuarioNaoAutorizadoException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Usuario nao autorizado", ex.getMessage(), "/errors/usuario-nao-autorizado");
    }

    // StatusProjeto
    @ExceptionHandler(StatusProjetoService.StatusProjetoNaoEncontradoException.class)
    public ProblemDetail handleStatusProjetoNaoEncontrado(StatusProjetoService.StatusProjetoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Status de projeto nao encontrado", ex.getMessage(), "/errors/status-projeto-nao-encontrado");
    }

    @ExceptionHandler(StatusProjetoService.StatusProjetoNomeJaExisteException.class)
    public ProblemDetail handleStatusProjetoNomeJaExiste(StatusProjetoService.StatusProjetoNomeJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Nome de status ja existe", ex.getMessage(), "/errors/status-projeto-nome-ja-existe");
    }

    @ExceptionHandler(StatusProjetoService.StatusProjetoOrdemJaExisteException.class)
    public ProblemDetail handleStatusProjetoOrdemJaExiste(StatusProjetoService.StatusProjetoOrdemJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Ordem de status ja existe", ex.getMessage(), "/errors/status-projeto-ordem-ja-existe");
    }

    @ExceptionHandler(StatusProjetoService.StatusProjetoEmUsoException.class)
    public ProblemDetail handleStatusProjetoEmUso(StatusProjetoService.StatusProjetoEmUsoException ex) {
        return problem(HttpStatus.CONFLICT, "Status em uso", ex.getMessage(), "/errors/status-projeto-em-uso");
    }

    // Wiki / VisaoProduto
    @ExceptionHandler(VisaoProdutoService.VisaoProdutoNaoEncontradaException.class)
    public ProblemDetail handleVisaoProdutoNaoEncontrada(VisaoProdutoService.VisaoProdutoNaoEncontradaException ex) {
        return problem(HttpStatus.NOT_FOUND, "Wiki nao encontrada", ex.getMessage(), "/errors/wiki-nao-encontrada");
    }

    @ExceptionHandler(VisaoProdutoService.ProjetoNaoEncontradoException.class)
    public ProblemDetail handleProjetoNaoEncontradoWiki(VisaoProdutoService.ProjetoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Projeto nao encontrado", ex.getMessage(), "/errors/projeto-nao-encontrado");
    }

    @ExceptionHandler(VisaoProdutoService.ProjetoInativoException.class)
    public ProblemDetail handleProjetoInativoWiki(VisaoProdutoService.ProjetoInativoException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Projeto inativo", ex.getMessage(), "/errors/projeto-inativo");
    }

    // Evento
    @ExceptionHandler(EventoService.EventoNaoEncontradoException.class)
    public ProblemDetail handleEventoNaoEncontrado(EventoService.EventoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Evento nao encontrado", ex.getMessage(), "/errors/evento-nao-encontrado");
    }

    @ExceptionHandler(EventoService.EventoDataInvalidaException.class)
    public ProblemDetail handleEventoDataInvalida(EventoService.EventoDataInvalidaException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Data do evento invalida", ex.getMessage(), "/errors/evento-data-invalida");
    }

    @ExceptionHandler(EventoService.ProjetoNaoEncontradoException.class)
    public ProblemDetail handleProjetoNaoEncontradoEvento(EventoService.ProjetoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Projeto nao encontrado", ex.getMessage(), "/errors/projeto-nao-encontrado");
    }

    @ExceptionHandler(EventoService.OrganizacaoNaoEncontradaException.class)
    public ProblemDetail handleOrganizacaoNaoEncontradaEvento(EventoService.OrganizacaoNaoEncontradaException ex) {
        return problem(HttpStatus.NOT_FOUND, "Organizacao nao encontrada", ex.getMessage(), "/errors/organizacao-nao-encontrada");
    }

    @ExceptionHandler(EventoService.UsuarioNaoAutorizadoException.class)
    public ProblemDetail handleUsuarioNaoAutorizadoEvento(EventoService.UsuarioNaoAutorizadoException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Usuario nao autorizado", ex.getMessage(), "/errors/usuario-nao-autorizado");
    }

    // StatusRequisito
    @ExceptionHandler(StatusRequisitoService.StatusRequisitoNaoEncontradoException.class)
    public ProblemDetail handleStatusRequisitoNaoEncontrado(StatusRequisitoService.StatusRequisitoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Status de requisito nao encontrado", ex.getMessage(), "/errors/status-requisito-nao-encontrado");
    }

    @ExceptionHandler(StatusRequisitoService.StatusRequisitoNomeJaExisteException.class)
    public ProblemDetail handleStatusRequisitoNomeJaExiste(StatusRequisitoService.StatusRequisitoNomeJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Nome de status ja existe", ex.getMessage(), "/errors/status-requisito-nome-ja-existe");
    }

    @ExceptionHandler(StatusRequisitoService.StatusRequisitoOrdemJaExisteException.class)
    public ProblemDetail handleStatusRequisitoOrdemJaExiste(StatusRequisitoService.StatusRequisitoOrdemJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Ordem de status ja existe", ex.getMessage(), "/errors/status-requisito-ordem-ja-existe");
    }

    @ExceptionHandler(StatusRequisitoService.StatusRequisitoEmUsoException.class)
    public ProblemDetail handleStatusRequisitoEmUso(StatusRequisitoService.StatusRequisitoEmUsoException ex) {
        return problem(HttpStatus.CONFLICT, "Status em uso", ex.getMessage(), "/errors/status-requisito-em-uso");
    }

    @ExceptionHandler(RequisitoService.RequisitoNaoEncontradoException.class)
    public ProblemDetail handleRequisitoNaoEncontrado(RequisitoService.RequisitoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Requisito não encontrado", ex.getMessage(), "/errors/requisito-nao-encontrado");
    }

    @ExceptionHandler(RequisitoService.ProjetoNaoEncontradoException.class)
    public ProblemDetail handleProjetoNaoEncontradoRequisito(RequisitoService.ProjetoNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Projeto não encontrado", ex.getMessage(), "/errors/projeto-nao-encontrado");
    }

    @ExceptionHandler(RequisitoService.UsuarioNaoAutorizadoException.class)
    public ProblemDetail handleUsuarioNaoAutorizado(RequisitoService.UsuarioNaoAutorizadoException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Usuário não autorizado", ex.getMessage(), "/errors/usuario-nao-autorizado");
    }

    @ExceptionHandler(CriterioAceiteService.CriterioAceiteNaoEncontradoException.class)
    public ProblemDetail handleCriterioAceiteNaoEncontrado(CriterioAceiteService.CriterioAceiteNaoEncontradoException ex) {
        return problem(HttpStatus.NOT_FOUND, "Critério de aceite não encontrado", ex.getMessage(), "/errors/criterio-aceite-nao-encontrado");
    }

    // Prioridade
    @ExceptionHandler(PrioridadeService.PrioridadeNaoEncontradaException.class)
    public ProblemDetail handlePrioridadeNaoEncontrada(PrioridadeService.PrioridadeNaoEncontradaException ex) {
        return problem(HttpStatus.NOT_FOUND, "Prioridade não encontrada", ex.getMessage(), "/errors/prioridade-nao-encontrada");
    }

    @ExceptionHandler(PrioridadeService.PrioridadeCodigoJaExisteException.class)
    public ProblemDetail handlePrioridadeCodigoJaExiste(PrioridadeService.PrioridadeCodigoJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Código de prioridade já existe", ex.getMessage(), "/errors/prioridade-codigo-ja-existe");
    }

    @ExceptionHandler(PrioridadeService.PrioridadeOrdemJaExisteException.class)
    public ProblemDetail handlePrioridadeOrdemJaExiste(PrioridadeService.PrioridadeOrdemJaExisteException ex) {
        return problem(HttpStatus.CONFLICT, "Ordem de prioridade já existe", ex.getMessage(), "/errors/prioridade-ordem-ja-existe");
    }

    @ExceptionHandler(PrioridadeService.PrioridadeEmUsoException.class)
    public ProblemDetail handlePrioridadeEmUso(PrioridadeService.PrioridadeEmUsoException ex) {
        return problem(HttpStatus.CONFLICT, "Prioridade em uso", ex.getMessage(), "/errors/prioridade-em-uso");
    }

    // Fallback
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Erro inesperado: {}", ex.getMessage(), ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.", "/errors/erro-interno");
    }

    private ProblemDetail problem(HttpStatus status, String title, String detail, String typeUri) {
        ProblemDetail p = ProblemDetail.forStatus(status);
        p.setTitle(title);
        p.setDetail(detail);
        p.setType(URI.create(typeUri));
        return p;
    }
}