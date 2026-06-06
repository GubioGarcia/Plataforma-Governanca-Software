package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.StatusRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarStatusRequisitoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.StatusRequisitoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.StatusRequisitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatusRequisitoService {

    private final StatusRequisitoRepository statusRequisitoRepository;
    private final RequisitoRepository requisitoRepository;

    @Transactional
    public StatusRequisitoResponseDTO criar(CriarStatusRequisitoRequestDTO request) {
        if (statusRequisitoRepository.existsByNomeIgnoreCase(request.nome())) {
            throw new StatusRequisitoNomeJaExisteException(request.nome());
        }
        if (statusRequisitoRepository.existsByOrdem(request.ordem())) {
            throw new StatusRequisitoOrdemJaExisteException(request.ordem());
        }

        StatusRequisito status = StatusRequisito.builder()
                .nome(request.nome().toUpperCase())
                .descricao(request.descricao())
                .ordem(request.ordem())
                .build();

        status = statusRequisitoRepository.save(status);
        log.info("StatusRequisito '{}' criado com sucesso. ID: {}", status.getNome(), status.getId());
        return mapToResponseDTO(status);
    }

    @Transactional(readOnly = true)
    public List<StatusRequisitoResponseDTO> listar() {
        return statusRequisitoRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getOrdem(), b.getOrdem()))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public StatusRequisitoResponseDTO buscarPorId(UUID id) {
        StatusRequisito status = statusRequisitoRepository.findById(id)
                .orElseThrow(() -> new StatusRequisitoNaoEncontradoException(id));
        return mapToResponseDTO(status);
    }

    @Transactional
    public StatusRequisitoResponseDTO atualizar(UUID id, AtualizarStatusRequisitoRequestDTO request) {
        StatusRequisito status = statusRequisitoRepository.findById(id)
                .orElseThrow(() -> new StatusRequisitoNaoEncontradoException(id));

        boolean nomeAlterado = !status.getNome().equalsIgnoreCase(request.nome());
        boolean ordemAlterada = !status.getOrdem().equals(request.ordem());

        if (nomeAlterado && statusRequisitoRepository.existsByNomeIgnoreCase(request.nome())) {
            throw new StatusRequisitoNomeJaExisteException(request.nome());
        }
        if (ordemAlterada && statusRequisitoRepository.existsByOrdem(request.ordem())) {
            throw new StatusRequisitoOrdemJaExisteException(request.ordem());
        }

        status.setNome(request.nome().toUpperCase());
        status.setDescricao(request.descricao());
        status.setOrdem(request.ordem());

        status = statusRequisitoRepository.save(status);
        log.info("StatusRequisito {} atualizado com sucesso.", id);
        return mapToResponseDTO(status);
    }

    @Transactional
    public void deletar(UUID id) {
        if (!statusRequisitoRepository.existsById(id)) {
            throw new StatusRequisitoNaoEncontradoException(id);
        }
        // Impede remoção de status que está vinculado a requisitos existentes.
        // Deletar um status em uso quebraria a integridade referencial e
        // tornaria requisitos existentes sem estado definido.
        if (requisitoRepository.existsByStatusId(id)) {
            throw new StatusRequisitoEmUsoException(id);
        }

        statusRequisitoRepository.deleteById(id);
        log.info("StatusRequisito {} removido com sucesso.", id);
    }

    private StatusRequisitoResponseDTO mapToResponseDTO(StatusRequisito s) {
        return new StatusRequisitoResponseDTO(s.getId(), s.getNome(), s.getDescricao(), s.getOrdem());
    }

    // Exceções de domínio
    public static class StatusRequisitoNaoEncontradoException extends RuntimeException {
        public StatusRequisitoNaoEncontradoException(UUID id) {
            super("Nenhum status de requisito encontrado com o id: " + id);
        }
    }

    public static class StatusRequisitoNomeJaExisteException extends RuntimeException {
        public StatusRequisitoNomeJaExisteException(String nome) {
            super("Já existe um status de requisito com o nome: " + nome);
        }
    }

    public static class StatusRequisitoOrdemJaExisteException extends RuntimeException {
        public StatusRequisitoOrdemJaExisteException(Integer ordem) {
            super("Já existe um status de requisito com a ordem: " + ordem);
        }
    }

    public static class StatusRequisitoEmUsoException extends RuntimeException {
        public StatusRequisitoEmUsoException(UUID id) {
            super("O status de requisito com id " + id + " está vinculado a requisitos e não pode ser removido.");
        }
    }
}