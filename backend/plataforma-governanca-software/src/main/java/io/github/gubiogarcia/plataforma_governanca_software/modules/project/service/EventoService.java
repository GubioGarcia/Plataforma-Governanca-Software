package io.github.gubiogarcia.plataforma_governanca_software.modules.project.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Evento;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarEventoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarEventoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.EventoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.EventoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final ProjetoRepository projetoRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    @Transactional
    public EventoResponseDTO criar(Jwt jwt, CriarEventoRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        Projeto projeto = projetoRepository.findById(request.projetoId())
                .orElseThrow(() -> new ProjetoNaoEncontradoException(request.projetoId()));

        Organizacao organizacao = organizacaoRepository.findById(request.organizacaoId())
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException(request.organizacaoId()));

        if (request.dataHoraFim() != null && request.dataHoraFim().isBefore(request.dataHoraInicio())) {
            throw new EventoDataInvalidaException("A data/hora de fim nao pode ser anterior a data/hora de inicio.");
        }

        Evento evento = Evento.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .projeto(projeto)
                .organizacao(organizacao)
                .criadoPor(usuario)
                .dataHoraInicio(request.dataHoraInicio())
                .dataHoraFim(request.dataHoraFim())
                .dataCriacao(Instant.now())
                .build();

        evento = eventoRepository.save(evento);
        log.info("Evento '{}' criado no projeto '{}'. ID: {}", evento.getNome(), projeto.getNome(), evento.getId());

        // ── Auditoria: criação do evento ─────────────────────────────────
        auditoriaService.registrar(
                usuario, organizacao, projeto,
                "EVENTO", evento.getId(), AcaoAuditoria.CRIACAO,
                "nome", null, evento.getNome()
        );

        interacaoService.registrar(usuario, projeto, ModuloInteracao.EVENTO, TipoInteracao.CRIACAO,
                evento.getId(), "Evento criado: " + evento.getNome());

        return mapToResponseDTO(evento);
    }

    @Transactional(readOnly = true)
    public List<EventoResponseDTO> listarPorProjeto(UUID projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new ProjetoNaoEncontradoException(projetoId);
        }
        return eventoRepository.findAllByProjetoId(projetoId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventoResponseDTO> listarPorOrganizacao(UUID organizacaoId) {
        if (!organizacaoRepository.existsById(organizacaoId)) {
            throw new OrganizacaoNaoEncontradaException(organizacaoId);
        }
        return eventoRepository.findAllByOrganizacaoId(organizacaoId).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventoResponseDTO buscarPorId(UUID id) {
        return mapToResponseDTO(eventoRepository.findById(id)
                .orElseThrow(() -> new EventoNaoEncontradoException(id)));
    }

    @Transactional
    public EventoResponseDTO atualizar(Jwt jwt, UUID id, AtualizarEventoRequestDTO request) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EventoNaoEncontradoException(id));

        if (request.dataHoraFim() != null && request.dataHoraFim().isBefore(request.dataHoraInicio())) {
            throw new EventoDataInvalidaException("A data/hora de fim nao pode ser anterior a data/hora de inicio.");
        }

        Usuario usuario = resolverUsuario(jwt);
        Projeto projeto  = evento.getProjeto();
        Organizacao org  = evento.getOrganizacao();

        // ── Auditoria campo a campo ──────────────────────────────────────
        registrarSeAlterado(usuario, org, projeto, id, "nome",
                evento.getNome(), request.nome());
        registrarSeAlterado(usuario, org, projeto, id, "descricao",
                evento.getDescricao(), request.descricao());

        String inicioAnterior = evento.getDataHoraInicio() != null ? evento.getDataHoraInicio().toString() : null;
        String inicioNovo     = request.dataHoraInicio() != null ? request.dataHoraInicio().toString() : null;
        registrarSeAlterado(usuario, org, projeto, id, "dataHoraInicio", inicioAnterior, inicioNovo);

        String fimAnterior = evento.getDataHoraFim() != null ? evento.getDataHoraFim().toString() : null;
        String fimNovo     = request.dataHoraFim() != null ? request.dataHoraFim().toString() : null;
        registrarSeAlterado(usuario, org, projeto, id, "dataHoraFim", fimAnterior, fimNovo);

        evento.setNome(request.nome());
        evento.setDescricao(request.descricao());
        evento.setDataHoraInicio(request.dataHoraInicio());
        evento.setDataHoraFim(request.dataHoraFim());

        evento = eventoRepository.save(evento);
        log.info("Evento {} atualizado com sucesso.", id);

        interacaoService.registrar(usuario, projeto, ModuloInteracao.EVENTO, TipoInteracao.EDICAO,
                id, "Evento atualizado: " + evento.getNome());

        return mapToResponseDTO(evento);
    }

    @Transactional
    public void deletar(Jwt jwt, UUID id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EventoNaoEncontradoException(id));

        Usuario usuario = resolverUsuario(jwt);

        // ── Auditoria: exclusão do evento ────────────────────────────────
        auditoriaService.registrar(
                usuario, evento.getOrganizacao(), evento.getProjeto(),
                "EVENTO", id, AcaoAuditoria.EXCLUSAO,
                "nome", evento.getNome(), null
        );

        interacaoService.registrar(usuario, evento.getProjeto(), ModuloInteracao.EVENTO, TipoInteracao.EXCLUSAO,
                id, "Evento removido: " + evento.getNome());

        eventoRepository.deleteById(id);
        log.info("Evento {} removido com sucesso.", id);
    }

    private void registrarSeAlterado(
            Usuario usuario, Organizacao org, Projeto projeto,
            UUID eventoId, String campo, String anterior, String novo) {
        if (!java.util.Objects.equals(anterior, novo)) {
            auditoriaService.registrar(
                    usuario, org, projeto,
                    "EVENTO", eventoId, AcaoAuditoria.EDICAO,
                    campo, anterior, novo
            );
        }
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuario autenticado nao encontrado na plataforma."));
    }

    private EventoResponseDTO mapToResponseDTO(Evento e) {
        return new EventoResponseDTO(
                e.getId(),
                e.getNome(),
                e.getDescricao(),
                e.getProjeto().getId(),
                e.getProjeto().getNome(),
                e.getOrganizacao().getId(),
                e.getOrganizacao().getNome(),
                e.getCriadoPor().getId(),
                e.getCriadoPor().getNome(),
                e.getDataHoraInicio(),
                e.getDataHoraFim(),
                e.getDataCriacao());
    }

    // Excecoes de dominio

    public static class EventoNaoEncontradoException extends RuntimeException {
        public EventoNaoEncontradoException(UUID id) {
            super("Nenhum evento encontrado com o id: " + id);
        }
    }

    public static class EventoDataInvalidaException extends RuntimeException {
        public EventoDataInvalidaException(String message) { super(message); }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID id) {
            super("Nenhum projeto encontrado com o id: " + id);
        }
    }

    public static class OrganizacaoNaoEncontradaException extends RuntimeException {
        public OrganizacaoNaoEncontradaException(UUID id) {
            super("Nenhuma organizacao encontrada com o id: " + id);
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String message) { super(message); }
    }
}