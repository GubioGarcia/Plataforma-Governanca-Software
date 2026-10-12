package io.github.gubiogarcia.plataforma_governanca_software.modules.organization.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.service.GruposAcessoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.AtualizarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.CriarOrganizacaoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.dto.OrganizacaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
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
    private final GruposAcessoService gruposAcessoService;
    private final AutorizacaoService autorizacao;

    @Transactional
    public OrganizacaoResponseDTO criar(Jwt jwt, CriarOrganizacaoRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        if (organizacaoRepository.existsByNome(request.nome())) {
            throw new OrganizacaoNomeJaExisteException(request.nome());
        }

        Organizacao organizacao = Organizacao.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .plano(request.plano())
                .ativo(true)
                .criadoPor(usuario.getId())
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        // flush antes do Keycloak: erro de banco aparece antes de criar os grupos
        organizacao = organizacaoRepository.saveAndFlush(organizacao);

        // Grupos de acesso /org-{id} (criador vira Dono); revertidos se a transação falhar
        organizacao.setKeycloakGroupId(gruposAcessoService.criarEstruturaOrganizacao(organizacao, usuario));

        log.info("Organização '{}' criada com sucesso. ID: {}, criada por: {}", organizacao.getNome(), organizacao.getId(), usuario.getId());

        return mapToResponseDTO(organizacao, 0L);
    }

    @Transactional(readOnly = true)
    public List<OrganizacaoResponseDTO> listar(Boolean ativo) {
        // Multi-tenancy: só as organizações com as quais o usuário tem vínculo
        List<Organizacao> organizacoes = organizacaoRepository.findAllById(autorizacao.organizacoesComVinculo()).stream()
                .filter(o -> ativo == null || ativo.equals(o.getAtivo()))
                .toList();

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
        autorizacao.exigirVinculo(organizacao);
        long total = projetoRepository.countByOrganizacaoIdAndAtivo(id, true);
        return mapToResponseDTO(organizacao, total);
    }

    @Transactional
    public OrganizacaoResponseDTO atualizar(UUID id, AtualizarOrganizacaoRequestDTO request) {
        Organizacao organizacao = organizacaoRepository.findById(id)
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException("Nenhuma organização encontrada com o id: " + id));
        autorizacao.exigir(organizacao, Permissao.ORG_EDIT);

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
        autorizacao.exigir(organizacao, Permissao.ORG_INATIVAR);

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
        autorizacao.exigir(organizacao, Permissao.ORG_INATIVAR); // reativar = mesma permissão (D15)

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

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuário autenticado não encontrado na plataforma."));
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