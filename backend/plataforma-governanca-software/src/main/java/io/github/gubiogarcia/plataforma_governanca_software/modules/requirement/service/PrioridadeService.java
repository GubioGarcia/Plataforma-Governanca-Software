package io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Prioridade;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.AtualizarPrioridadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.CriarPrioridadeRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.dto.PrioridadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.PrioridadeRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrioridadeService {

    private final PrioridadeRepository prioridadeRepository;
    private final RequisitoRepository requisitoRepository;

    @Transactional
    public PrioridadeResponseDTO criar(CriarPrioridadeRequestDTO request) {
        if (prioridadeRepository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new PrioridadeCodigoJaExisteException(request.codigo());
        }
        if (prioridadeRepository.existsByOrdem(request.ordem())) {
            throw new PrioridadeOrdemJaExisteException(request.ordem());
        }

        Prioridade prioridade = Prioridade.builder()
                .codigo(request.codigo().toUpperCase())
                .nome(request.nome())
                .descricao(request.descricao())
                .ordem(request.ordem())
                .ativo(true)
                .build();

        prioridade = prioridadeRepository.save(prioridade);
        log.info("Prioridade '{}' criada com sucesso. ID: {}", prioridade.getNome(), prioridade.getId());
        return mapToResponseDTO(prioridade);
    }

    @Transactional(readOnly = true)
    public List<PrioridadeResponseDTO> listar() {
        return prioridadeRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getOrdem(), b.getOrdem()))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PrioridadeResponseDTO> listarAtivas() {
        return prioridadeRepository.findAllByAtivoTrue().stream()
                .sorted((a, b) -> Integer.compare(a.getOrdem(), b.getOrdem()))
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrioridadeResponseDTO buscarPorId(UUID id) {
        Prioridade prioridade = prioridadeRepository.findById(id)
                .orElseThrow(() -> new PrioridadeNaoEncontradaException(id));
        return mapToResponseDTO(prioridade);
    }

    @Transactional
    public PrioridadeResponseDTO atualizar(UUID id, AtualizarPrioridadeRequestDTO request) {
        Prioridade prioridade = prioridadeRepository.findById(id)
                .orElseThrow(() -> new PrioridadeNaoEncontradaException(id));

        if (request.nome() != null) prioridade.setNome(request.nome());
        if (request.descricao() != null) prioridade.setDescricao(request.descricao());
        if (request.ativo() != null) prioridade.setAtivo(request.ativo());

        prioridade = prioridadeRepository.save(prioridade);
        log.info("Prioridade {} atualizada com sucesso.", id);
        return mapToResponseDTO(prioridade);
    }

    @Transactional
    public void deletar(UUID id) {
        if (!prioridadeRepository.existsById(id)) {
            throw new PrioridadeNaoEncontradaException(id);
        }
        if (requisitoRepository.existsByPrioridadeId(id)) {
            throw new PrioridadeEmUsoException(id);
        }
        prioridadeRepository.deleteById(id);
        log.info("Prioridade {} removida com sucesso.", id);
    }

    private PrioridadeResponseDTO mapToResponseDTO(Prioridade p) {
        return new PrioridadeResponseDTO(
                p.getId(),
                p.getCodigo(),
                p.getNome(),
                p.getDescricao(),
                p.getOrdem(),
                p.getAtivo()
        );
    }

    // Domain exceptions
    public static class PrioridadeNaoEncontradaException extends RuntimeException {
        public PrioridadeNaoEncontradaException(UUID id) {
            super("Prioridade não encontrada com o id: " + id);
        }
    }

    public static class PrioridadeCodigoJaExisteException extends RuntimeException {
        public PrioridadeCodigoJaExisteException(String codigo) {
            super("Já existe uma prioridade com o código: " + codigo);
        }
    }

    public static class PrioridadeOrdemJaExisteException extends RuntimeException {
        public PrioridadeOrdemJaExisteException(Integer ordem) {
            super("Já existe uma prioridade com a ordem: " + ordem);
        }
    }

    public static class PrioridadeEmUsoException extends RuntimeException {
        public PrioridadeEmUsoException(UUID id) {
            super("A prioridade com id " + id + " está vinculada a requisitos e não pode ser removida.");
        }
    }
}
