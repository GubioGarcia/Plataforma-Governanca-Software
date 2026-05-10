package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.AtualizarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.CriarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.OrganizacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizacaoService {

    private final OrganizacaoRepository organizacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProjetoRepository projetoRepository;

    @Transactional
    public OrganizacaoResponseDTO criar(Jwt jwt, CriarOrganizacaoRequestDTO request) {
        UUID usuarioId = resolverUsuarioId(jwt);

        if (organizacaoRepository.existsByNome(request.nome())) {
            throw new OrganizacaoNomeJaExisteException(request.nome());
        }

        Organizacao organizacao = Organizacao.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .plano(request.plano())
                .ativo(true)
                .criadoPor(usuarioId)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        organizacao = organizacaoRepository.save(organizacao);

        log.info("Organização '{}' criada com sucesso. ID: {}, criada por: {}", organizacao.getNome(), organizacao.getId(), usuarioId);

        return mapToResponseDTO(organizacao, 0L);
    }

    @Transactional(readOnly = true)
    public List<OrganizacaoResponseDTO> listar(Boolean ativo) {
        List<Organizacao> organizacoes = (ativo == null)
                ? organizacaoRepository.findAll()
                : organizacaoRepository.findAllByAtivo(ativo);

        List<UUID> ids = organizacoes.stream().map(Organizacao::getId).toList();

        Map<UUID, Long> contagemPorOrg = projetoRepository
                .countProjetosAtivosByOrganizacaoIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        return organizacoes.stream()
                .map(o -> mapToResponseDTO(o, contagemPorOrg.getOrDefault(o.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public OrganizacaoResponseDTO buscarPorId(UUID id) {
        Organizacao organizacao = organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException("Nenhuma organização encontrada com o id: " + id));
        long total = projetoRepository.countByOrganizacaoIdAndAtivo(id, true);
        return mapToResponseDTO(organizacao, total);
    }

    @Transactional
    public OrganizacaoResponseDTO atualizar(UUID id, AtualizarOrganizacaoRequestDTO request) {
        Organizacao organizacao = organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException("Nenhuma organização encontrada com o id: " + id));

        if (Boolean.FALSE.equals(organizacao.getAtivo())) {
            throw new OrganizacaoInativaException(id);
        }

        String novoNome = request.nome();
        if (!organizacao.getNome().equalsIgnoreCase(novoNome) && organizacaoRepository.existsByNome(novoNome)) {
            throw new OrganizacaoNomeJaExisteException(novoNome);
        }

        organizacao.setNome(novoNome);
        organizacao.setDescricao(request.descricao());
        organizacao.setPlano(request.plano());
        organizacao.setDataAtualizacao(Instant.now());

        organizacao = organizacaoRepository.save(organizacao);

        log.info("Organização {} atualizada com sucesso.", id);

        long total = projetoRepository.countByOrganizacaoIdAndAtivo(id, true);
        return mapToResponseDTO(organizacao, total);
    }

    @Transactional
    public void inativar(UUID id) {
        Organizacao organizacao = organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException("Nenhuma organização encontrada com o id: " + id));

        if (Boolean.FALSE.equals(organizacao.getAtivo())) {
            throw new OrganizacaoJaInativaException(id);
        }

        organizacao.setAtivo(false);
        organizacao.setDataAtualizacao(Instant.now());
        organizacaoRepository.save(organizacao);

        log.info("Organização {} inativada com sucesso.", id);
    }
    
    @Transactional
    public OrganizacaoResponseDTO ativar(UUID id) {
        Organizacao organizacao = organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException("Nenhuma organizacao encontrada com o id: " + id));

        if (Boolean.TRUE.equals(organizacao.getAtivo())) {
            throw new OrganizacaoJaAtivaException(id);
        }

        organizacao.setAtivo(true);
        organizacao.setDataAtualizacao(Instant.now());
        organizacao = organizacaoRepository.save(organizacao);

        log.info("Organizacao {} reativada com sucesso.", id);

        long total = projetoRepository.countByOrganizacaoIdAndAtivo(id, true);
        return mapToResponseDTO(organizacao, total);
    }

    // Helpers privados

    private UUID resolverUsuarioId(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        Usuario usuario = usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuário autenticado não encontrado na plataforma."));
        return usuario.getId();
    }

    private OrganizacaoResponseDTO mapToResponseDTO(Organizacao o, Long totalProjetosAtivos) {
        return new OrganizacaoResponseDTO(
                o.getId(),
                o.getNome(),
                o.getDescricao(),
                o.getPlano(),
                o.getAtivo(),
                o.getCriadoPor(),
                o.getDataCriacao(),
                o.getDataAtualizacao(),
                totalProjetosAtivos
        );
    }

    // Exceções de domínio

    public static class OrganizacaoNaoEncontradaException extends RuntimeException {
        public OrganizacaoNaoEncontradaException(String message) {
            super(message);
        }
    }

    public static class OrganizacaoNomeJaExisteException extends RuntimeException {
        public OrganizacaoNomeJaExisteException(String nome) {
            super("Já existe uma organização cadastrada com o nome: " + nome);
        }
    }

    public static class OrganizacaoJaInativaException extends RuntimeException {
        public OrganizacaoJaInativaException(UUID id) {
            super("A organização com id " + id + " já está inativa.");
        }
    }

    public static class OrganizacaoJaAtivaException extends RuntimeException {
        public OrganizacaoJaAtivaException(UUID id) {
            super("A organizacao com id " + id + " ja esta ativa.");
        }
    }

    public static class OrganizacaoInativaException extends RuntimeException {
        public OrganizacaoInativaException(UUID id) {
            super("Não é possível editar a organização com id " + id + " pois ela está inativa.");
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String message) {
            super(message);
        }
    }
}