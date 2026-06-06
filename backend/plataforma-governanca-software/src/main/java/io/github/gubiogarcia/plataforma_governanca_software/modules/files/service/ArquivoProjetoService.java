package io.github.gubiogarcia.plataforma_governanca_software.modules.files.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.files.domain.ArquivoProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.files.dto.ArquivoProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.files.repository.ArquivoProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service.InteracaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.organization.repository.OrganizacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArquivoProjetoService {

    // Sem restrição de extensão — apenas tamanho máximo é validado

    @Value("${file.storage.root:/files}")
    private String storageRoot;

    @Value("${file.storage.max-upload-size-mb:20}")
    private long maxUploadSizeMb;

    private final ArquivoProjetoRepository arquivoRepository;
    private final ProjetoRepository projetoRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final InteracaoService interacaoService;

    // ── Upload ─────────────────────────────────────────────────────────────────

    @Transactional
    public ArquivoProjetoResponseDTO upload(Jwt jwt, UUID projetoId, MultipartFile file) {
        Usuario usuario = resolverUsuario(jwt);

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));

        validarArquivo(file);

        String nomeOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "arquivo";
        String extensao = extrairExtensao(nomeOriginal);
        String nomeArquivo = UUID.randomUUID() + "." + extensao;

        UUID orgId = projeto.getOrganizacao().getId();

        Path diretorio = Paths.get(storageRoot, "organizations", orgId.toString(), "projects", projetoId.toString());
        criarDiretoriosSeNecessario(diretorio);

        Path destino = diretorio.resolve(nomeArquivo);
        salvarArquivoFisico(file, destino);

        ArquivoProjeto arquivo = ArquivoProjeto.builder()
                .projeto(projeto)
                .organizacao(projeto.getOrganizacao())
                .nomeOriginal(nomeOriginal)
                .nomeArquivo(nomeArquivo)
                .caminhoArquivo(destino.toString())
                .extensao(extensao)
                .mimeType(file.getContentType())
                .tamanhoBytes(file.getSize())
                .criadoPor(usuario)
                .dataUpload(Instant.now())
                .ativo(true)
                .build();

        arquivo = arquivoRepository.save(arquivo);
        log.info("Arquivo '{}' enviado ao projeto '{}'. ID: {}", nomeOriginal, projeto.getNome(), arquivo.getId());

        auditoriaService.registrar(
                usuario, projeto.getOrganizacao(), projeto,
                "ARQUIVO_PROJETO", arquivo.getId(), AcaoAuditoria.CRIACAO,
                "nomeOriginal", null, nomeOriginal
        );

        interacaoService.registrar(usuario, projeto, ModuloInteracao.ARQUIVO, TipoInteracao.CRIACAO,
                arquivo.getId(), "Arquivo enviado: " + nomeOriginal);

        return toResponseDTO(arquivo);
    }

    // ── Listagem ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ArquivoProjetoResponseDTO> listar(UUID projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new ProjetoNaoEncontradoException(projetoId);
        }
        return arquivoRepository.findAllByProjetoIdAndAtivoTrue(projetoId).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ── Download ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DownloadResult download(UUID fileId) {
        ArquivoProjeto arquivo = arquivoRepository.findByIdAndAtivoTrue(fileId)
                .orElseThrow(() -> new ArquivoNaoEncontradoException(fileId));

        Path caminho = Paths.get(arquivo.getCaminhoArquivo());
        if (!Files.exists(caminho)) {
            throw new ArquivoFisicoNaoEncontradoException(fileId);
        }

        try {
            Resource resource = new UrlResource(caminho.toUri());
            return new DownloadResult(resource, arquivo.getNomeOriginal(), arquivo.getMimeType());
        } catch (Exception e) {
            throw new ArquivoFisicoNaoEncontradoException(fileId);
        }
    }

    // ── Exclusão lógica ────────────────────────────────────────────────────────

    @Transactional
    public void deletar(Jwt jwt, UUID fileId) {
        Usuario usuario = resolverUsuario(jwt);

        ArquivoProjeto arquivo = arquivoRepository.findByIdAndAtivoTrue(fileId)
                .orElseThrow(() -> new ArquivoNaoEncontradoException(fileId));

        arquivo.setAtivo(false);
        arquivoRepository.save(arquivo);
        log.info("Arquivo '{}' excluído logicamente. ID: {}", arquivo.getNomeOriginal(), fileId);

        auditoriaService.registrar(
                usuario, arquivo.getOrganizacao(), arquivo.getProjeto(),
                "ARQUIVO_PROJETO", fileId, AcaoAuditoria.EXCLUSAO,
                "nomeOriginal", arquivo.getNomeOriginal(), null
        );

        interacaoService.registrar(usuario, arquivo.getProjeto(), ModuloInteracao.ARQUIVO, TipoInteracao.EXCLUSAO,
                fileId, "Arquivo excluído: " + arquivo.getNomeOriginal());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ArquivoInvalidoException("Nenhum arquivo enviado.");
        }

        long maxBytes = maxUploadSizeMb * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new ArquivoInvalidoException(
                    String.format("Arquivo excede o tamanho máximo de %dMB.", maxUploadSizeMb));
        }
    }

    private String extrairExtensao(String nomeArquivo) {
        int idx = nomeArquivo.lastIndexOf('.');
        if (idx < 0 || idx == nomeArquivo.length() - 1) return "bin";
        return nomeArquivo.substring(idx + 1).toLowerCase();
    }

    private void criarDiretoriosSeNecessario(Path diretorio) {
        try {
            Files.createDirectories(diretorio);
        } catch (IOException e) {
            throw new StorageException("Não foi possível criar o diretório de armazenamento.", e);
        }
    }

    private void salvarArquivoFisico(MultipartFile file, Path destino) {
        try {
            Files.copy(file.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new StorageException("Erro ao salvar o arquivo no disco.", e);
        }
    }

    private Usuario resolverUsuario(Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return usuarioRepository.findByExternalIdentityId(keycloakId)
                .orElseThrow(() -> new UsuarioNaoAutorizadoException("Usuário autenticado não encontrado na plataforma."));
    }

    private ArquivoProjetoResponseDTO toResponseDTO(ArquivoProjeto a) {
        return new ArquivoProjetoResponseDTO(
                a.getId(),
                a.getNomeOriginal(),
                a.getExtensao(),
                a.getMimeType(),
                a.getTamanhoBytes(),
                a.getDataUpload(),
                a.getCriadoPor() != null ? a.getCriadoPor().getNome() : "Desconhecido"
        );
    }

    // ── Record ─────────────────────────────────────────────────────────────────

    public record DownloadResult(Resource resource, String nomeOriginal, String mimeType) {}

    // ── Exceções de domínio ────────────────────────────────────────────────────

    public static class ArquivoNaoEncontradoException extends RuntimeException {
        public ArquivoNaoEncontradoException(UUID id) {
            super("Nenhum arquivo encontrado com o id: " + id);
        }
    }

    public static class ArquivoFisicoNaoEncontradoException extends RuntimeException {
        public ArquivoFisicoNaoEncontradoException(UUID id) {
            super("Arquivo físico não encontrado para o id: " + id);
        }
    }

    public static class ArquivoInvalidoException extends RuntimeException {
        public ArquivoInvalidoException(String message) { super(message); }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID id) {
            super("Nenhum projeto encontrado com o id: " + id);
        }
    }

    public static class UsuarioNaoAutorizadoException extends RuntimeException {
        public UsuarioNaoAutorizadoException(String message) { super(message); }
    }

    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) { super(message, cause); }
    }
}