package io.github.gubiogarcia.plataforma_governanca_software.modules.project.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.domain.Organizacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.ProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.StatusProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
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
public class ProjetoService {

    private final ProjetoRepository projetoRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final StatusProjetoRepository statusProjetoRepository;
    private final UsuarioRepository usuarioRepository;

    // Status inicial padrão ao criar um projeto
    private static final String STATUS_INICIAL_NOME = "RASCUNHO";

    @Transactional
    public ProjetoResponseDTO criar(Jwt jwt, CriarProjetoRequestDTO request) {
        Usuario usuario = resolverUsuario(jwt);

        Organizacao organizacao = organizacaoRepository.findById(request.organizacaoId())
                .orElseThrow(() -> new OrganizacaoNaoEncontradaException(request.organizacaoId()));

        if (Boolean.FALSE.equals(organizacao.getAtivo())) {
            throw new OrganizacaoInativaException(organizacao.getId());
        }

        if (projetoRepository.existsByNomeAndOrganizacaoId(request.nome(), organizacao.getId())) {
            throw new ProjetoNomeJaExisteNaOrganizacaoException(request.nome(), organizacao.getNome());
        }

        StatusProjeto statusInicial = statusProjetoRepository.findByNomeIgnoreCase(STATUS_INICIAL_NOME)
                .orElseThrow(() -> new StatusProjetoService.StatusProjetoNaoEncontradoException(
                        "Status inicial '" + STATUS_INICIAL_NOME + "' não encontrado. Verifique a configuração do sistema."));

        Projeto projeto = Projeto.builder()
                .organizacao(organizacao)
                .nome(request.nome())
                .descricao(request.descricao())
                .status(statusInicial)
                .ativo(true)
                .criadoPor(usuario)
                .dataCriacao(Instant.now())
                .dataAtualizacao(Instant.now())
                .build();

        projeto = projetoRepository.save(projeto);
        log.info("Projeto '{}' criado na organização '{}'. ID: {}, criado por: {}",
                projeto.getNome(), organizacao.getNome(), projeto.getId(), usuario.getId());

        return mapToResponseDTO(projeto);
    }

    @Transactional(readOnly = true)
    public List<ProjetoResponseDTO> listarPorOrganizacao(UUID organizacaoId, Boolean ativo) {
        if (!organizacaoRepository.existsById(organizacaoId)) {
            throw new OrganizacaoNaoEncontradaException(organizacaoId);
        }

        List<Projeto> projetos = (ativo == null)
                ? projetoRepository.findAllByOrganizacaoId(organizacaoId)
                : projetoRepository.findAllByOrganizacaoIdAndAtivo(organizacaoId, ativo);

        return projetos.stream().map(this::mapToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public ProjetoResponseDTO buscarPorId(UUID id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new ProjetoNaoEncontradoException("Nenhum projeto encontrado com o id: " + id));
        return mapToResponseDTO(projeto);
    }

    @Transactional
    public ProjetoResponseDTO atualizar(UUID id, AtualizarProjetoRequestDTO request) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new ProjetoNaoEncontradoException("Nenhum projeto encontrado com o id: " + id));

        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ProjetoInativoException(id);
        }

        String novoNome = request.nome();
        boolean nomeAlterado = !projeto.getNome().equalsIgnoreCase(novoNome);
        if (nomeAlterado && projetoRepository.existsByNomeAndOrganizacaoId(novoNome, projeto.getOrganizacao().getId())) {
            throw new ProjetoNomeJaExisteNaOrganizacaoException(novoNome, projeto.getOrganizacao().getNome());
        }

        StatusProjeto novoStatus = statusProjetoRepository.findById(request.statusId())
                .orElseThrow(() -> new StatusProjetoService.StatusProjetoNaoEncontradoException(
                        "Nenhum status encontrado com o id: " + request.statusId()));

        projeto.setNome(novoNome);
        projeto.setDescricao(request.descricao());
        projeto.setStatus(novoStatus);
        projeto.setDataAtualizacao(Instant.now());

        projeto = projetoRepository.save(projeto);
        log.info("Projeto {} atualizado com sucesso.", id);
        return mapToResponseDTO(projeto);
    }

    @Transactional
    public void inativar(UUID id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new ProjetoNaoEncontradoException("Nenhum projeto encontrado com o id: " + id));

        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ProjetoJaInativoException(id);
        }

        projeto.setAtivo(false);
        projeto.setDataAtualizacao(Instant.now());
        projetoRepository.save(projeto);
        log.info("Projeto {} inativado com sucesso.", id);
    }

    // Helpers privados

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuário autenticado não encontrado na plataforma."));
    }

    private ProjetoResponseDTO mapToResponseDTO(Projeto p) {
        StatusProjetoResponseDTO statusDTO = new StatusProjetoResponseDTO(
                p.getStatus().getId(),
                p.getStatus().getNome(),
                p.getStatus().getDescricao(),
                p.getStatus().getOrdem()
        );
        return new ProjetoResponseDTO(
                p.getId(),
                p.getOrganizacao().getId(),
                p.getOrganizacao().getNome(),
                p.getNome(),
                p.getDescricao(),
                statusDTO,
                p.getAtivo(),
                p.getCriadoPor().getId(),
                p.getCriadoPor().getNome(),
                p.getDataCriacao(),
                p.getDataAtualizacao()
        );
    }

    // Exceções de domínio

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(String message) { super(message); }
    }

    public static class ProjetoNomeJaExisteNaOrganizacaoException extends RuntimeException {
        public ProjetoNomeJaExisteNaOrganizacaoException(String nome, String orgNome) {
            super("Já existe um projeto com o nome '" + nome + "' na organização '" + orgNome + "'.");
        }
    }

    public static class ProjetoJaInativoException extends RuntimeException {
        public ProjetoJaInativoException(UUID id) {
            super("O projeto com id " + id + " já está inativo.");
        }
    }

    public static class ProjetoInativoException extends RuntimeException {
        public ProjetoInativoException(UUID id) {
            super("Não é possível editar o projeto com id " + id + " pois ele está inativo.");
        }
    }

    public static class OrganizacaoNaoEncontradaException extends RuntimeException {
        public OrganizacaoNaoEncontradaException(UUID id) {
            super("Nenhuma organização encontrada com o id: " + id);
        }
    }

    public static class OrganizacaoInativaException extends RuntimeException {
        public OrganizacaoInativaException(UUID id) {
            super("A organização com id " + id + " está inativa e não permite novos projetos.");
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String message) { super(message); }
    }
}
