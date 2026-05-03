package io.github.gubiogarcia.plataforma_governanca_software.modules.product.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.product.domain.VisaoProduto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.AtualizarVisaoProdutoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.dto.VisaoProdutoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.product.repository.VisaoProdutoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisaoProdutoService {

    private final VisaoProdutoRepository visaoProdutoRepository;
    private final ProjetoRepository projetoRepository;

    @Transactional
    public VisaoProduto inicializarParaProjeto(Projeto projeto) {
        VisaoProduto visao = VisaoProduto.builder()
                .projeto(projeto)
                .dataAtualizacao(Instant.now())
                .build();
        visao = visaoProdutoRepository.save(visao);
        log.info("VisaoProduto inicializada para o projeto '{}'. ID: {}", projeto.getNome(), visao.getId());
        return visao;
    }

    @Transactional(readOnly = true)
    public VisaoProdutoResponseDTO buscarPorProjetoId(UUID projetoId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));
        VisaoProduto visao = visaoProdutoRepository.findByProjetoId(projetoId)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(projetoId));
        return mapToResponseDTO(visao, projeto);
    }

    @Transactional(readOnly = true)
    public VisaoProdutoResponseDTO buscarPorId(UUID id) {
        VisaoProduto visao = visaoProdutoRepository.findById(id)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(id));
        return mapToResponseDTO(visao, visao.getProjeto());
    }

    @Transactional
    public VisaoProdutoResponseDTO atualizar(UUID projetoId, AtualizarVisaoProdutoRequestDTO request) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ProjetoNaoEncontradoException(projetoId));

        if (Boolean.FALSE.equals(projeto.getAtivo())) {
            throw new ProjetoInativoException(projetoId);
        }

        VisaoProduto visao = visaoProdutoRepository.findByProjetoId(projetoId)
                .orElseThrow(() -> new VisaoProdutoNaoEncontradaException(projetoId));

        Instant agora = Instant.now();

        visao.setDescricaoProblema(request.descricaoProblema());
        visao.setPublicoAlvo(request.publicoAlvo());
        visao.setObjetivoGeral(request.objetivoGeral());
        visao.setObjetivosEspecificos(request.objetivosEspecificos());
        visao.setKpis(request.kpis());
        visao.setRestricoesPrazo(request.restricoesPrazo());
        visao.setRestricoesOrcamento(request.restricoesOrcamento());
        visao.setTecnologiasObrigatorias(request.tecnologiasObrigatorias());
        visao.setRegulamentacoes(request.regulamentacoes());
        visao.setDataAtualizacao(agora);

        // Propaga data_atualizacao para o Projeto pai
        projeto.setDataAtualizacao(agora);
        projetoRepository.save(projeto);

        visao = visaoProdutoRepository.save(visao);
        log.info("VisaoProduto do projeto {} atualizada com sucesso.", projetoId);
        return mapToResponseDTO(visao, projeto);
    }

    private VisaoProdutoResponseDTO mapToResponseDTO(VisaoProduto v, Projeto p) {
        return new VisaoProdutoResponseDTO(
                v.getId(),
                p.getId(),
                p.getNome(),
                p.getDescricao(),
                p.getCriadoPor().getId(),
                p.getCriadoPor().getNome(),
                p.getStatus() != null ? p.getStatus().getNome() : null,
                v.getDescricaoProblema(),
                v.getPublicoAlvo(),
                v.getObjetivoGeral(),
                v.getObjetivosEspecificos(),
                v.getKpis(),
                v.getRestricoesPrazo(),
                v.getRestricoesOrcamento(),
                v.getTecnologiasObrigatorias(),
                v.getRegulamentacoes(),
                v.getDataAtualizacao());
    }

    // Excecoes de dominio
    public static class VisaoProdutoNaoEncontradaException extends RuntimeException {
        public VisaoProdutoNaoEncontradaException(UUID id) {
            super("Wiki nao encontrada para o id: " + id);
        }
    }

    public static class ProjetoNaoEncontradoException extends RuntimeException {
        public ProjetoNaoEncontradoException(UUID projetoId) {
            super("Nenhum projeto encontrado com o id: " + projetoId);
        }
    }

    public static class ProjetoInativoException extends RuntimeException {
        public ProjetoInativoException(UUID projetoId) {
            super("Nao e possivel editar a Wiki do projeto com id " + projetoId + " pois ele esta inativo.");
        }
    }
}