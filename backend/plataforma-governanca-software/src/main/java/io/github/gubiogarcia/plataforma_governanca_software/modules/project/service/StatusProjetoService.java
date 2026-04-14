package io.github.gubiogarcia.plataforma_governanca_software.modules.project.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.StatusProjeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarStatusProjetoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.StatusProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.StatusProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatusProjetoService {

    private final StatusProjetoRepository statusProjetoRepository;

    @Transactional
    public StatusProjetoResponseDTO criar(CriarStatusProjetoRequestDTO request) {
        if (statusProjetoRepository.existsByNomeIgnoreCase(request.nome())) {
            throw new StatusProjetoNomeJaExisteException(request.nome());
        }
        if (statusProjetoRepository.existsByOrdem(request.ordem())) {
            throw new StatusProjetoOrdemJaExisteException(request.ordem());
        }

        StatusProjeto status = StatusProjeto.builder()
                .nome(request.nome().toUpperCase())
                .descricao(request.descricao())
                .ordem(request.ordem())
                .build();

        status = statusProjetoRepository.save(status);
        log.info("StatusProjeto '{}' criado com sucesso. ID: {}", status.getNome(), status.getId());
        return mapToResponseDTO(status);
    }

    @Transactional(readOnly = true)
    public List<StatusProjetoResponseDTO> listar() {
        return statusProjetoRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getOrdem(), b.getOrdem()))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public StatusProjetoResponseDTO buscarPorId(UUID id) {
        StatusProjeto status = statusProjetoRepository.findById(id)
                .orElseThrow(() -> new StatusProjetoNaoEncontradoException("Nenhum status encontrado com o id: " + id));
        return mapToResponseDTO(status);
    }

    @Transactional
    public StatusProjetoResponseDTO atualizar(UUID id, AtualizarStatusProjetoRequestDTO request) {
        StatusProjeto status = statusProjetoRepository.findById(id)
                .orElseThrow(() -> new StatusProjetoNaoEncontradoException("Nenhum status encontrado com o id: " + id));

        boolean nomeAlterado = !status.getNome().equalsIgnoreCase(request.nome());
        boolean ordemAlterada = !status.getOrdem().equals(request.ordem());

        if (nomeAlterado && statusProjetoRepository.existsByNomeIgnoreCase(request.nome())) {
            throw new StatusProjetoNomeJaExisteException(request.nome());
        }
        if (ordemAlterada && statusProjetoRepository.existsByOrdem(request.ordem())) {
            throw new StatusProjetoOrdemJaExisteException(request.ordem());
        }

        status.setNome(request.nome().toUpperCase());
        status.setDescricao(request.descricao());
        status.setOrdem(request.ordem());

        status = statusProjetoRepository.save(status);
        log.info("StatusProjeto {} atualizado com sucesso.", id);
        return mapToResponseDTO(status);
    }

    @Transactional
    public void deletar(UUID id) {
        if (!statusProjetoRepository.existsById(id)) {
            throw new StatusProjetoNaoEncontradoException("Nenhum status encontrado com o id: " + id);
        }
        statusProjetoRepository.deleteById(id);
        log.info("StatusProjeto {} removido com sucesso.", id);
    }

    // Helper

    public StatusProjetoResponseDTO mapToResponseDTO(StatusProjeto s) {
        return new StatusProjetoResponseDTO(s.getId(), s.getNome(), s.getDescricao(), s.getOrdem());
    }

    // Exceções de domínio

    public static class StatusProjetoNaoEncontradoException extends RuntimeException {
        public StatusProjetoNaoEncontradoException(String message) {
            super(message);
        }
    }

    public static class StatusProjetoNomeJaExisteException extends RuntimeException {
        public StatusProjetoNomeJaExisteException(String nome) {
            super("Já existe um status com o nome: " + nome);
        }
    }

    public static class StatusProjetoOrdemJaExisteException extends RuntimeException {
        public StatusProjetoOrdemJaExisteException(Integer ordem) {
            super("Já existe um status com a ordem: " + ordem);
        }
    }

    public static class StatusProjetoEmUsoException extends RuntimeException {
        public StatusProjetoEmUsoException(UUID id) {
            super("O status com id " + id + " está vinculado a projetos e não pode ser removido.");
        }
    }
}
