package io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.repository.ImpactoDadosRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.domain.Requisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.repository.RequisitoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.requirement.service.RequisitoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoRelacaoMatriz;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.TipoVinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.domain.VinculoRequisito;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.repository.VinculoRequisitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Matriz de rastreabilidade dinâmica e análise de impacto de mudança.
 *
 * <p>Nada é materializado: a matriz é recomputada a cada leitura combinando as
 * arestas DIRETAS ({@link VinculoRequisito}) com as INDIRETAS (dois requisitos
 * que impactam a mesma EntidadeDados, via {@code ImpactoDados}). A análise de
 * impacto é uma travessia em largura (BFS) sobre esse grafo — suficiente para a
 * escala de um TCC, conforme o estudo de evolução (§3.1).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatrizRastreabilidadeService {

    private final RequisitoRepository requisitoRepository;
    private final ProjetoRepository projetoRepository;
    private final VinculoRequisitoRepository vinculoRequisitoRepository;
    private final ImpactoDadosRepository impactoDadosRepository;

    // ── Matriz ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MatrizRastreabilidadeResponseDTO montarMatriz(UUID projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new RequisitoService.ProjetoNaoEncontradoException(projetoId);
        }

        List<RequisitoResumoDTO> eixo = requisitoRepository.findAllByProjetoId(projetoId).stream()
                .filter(r -> Boolean.TRUE.equals(r.getAtivo()))
                .map(this::mapResumo)
                .sorted(Comparator.comparing(RequisitoResumoDTO::codigo, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        // chave "origem|destino" -> acumuladores
        Map<String, List<TipoVinculoRequisito>> tiposPorCelula = new LinkedHashMap<>();
        Map<String, LinkedHashSet<String>> entidadesPorCelula = new LinkedHashMap<>();
        LinkedHashSet<String> chaves = new LinkedHashSet<>();

        for (VinculoRequisito v : vinculoRequisitoRepository.findAllByProjetoId(projetoId)) {
            String k = chave(v.getRequisitoOrigem().getId(), v.getRequisitoDestino().getId());
            chaves.add(k);
            tiposPorCelula.computeIfAbsent(k, x -> new ArrayList<>()).add(v.getTipo());
        }

        for (Object[] row : impactoDadosRepository.findParesIndiretosByProjetoId(projetoId)) {
            UUID origem = (UUID) row[0];
            UUID destino = (UUID) row[1];
            String entidadeNome = (String) row[2];
            String k = chave(origem, destino);
            chaves.add(k);
            entidadesPorCelula.computeIfAbsent(k, x -> new LinkedHashSet<>()).add(entidadeNome);
        }

        List<CelulaMatrizDTO> celulas = new ArrayList<>();
        for (String k : chaves) {
            String[] parts = k.split("\\|");
            UUID origem = UUID.fromString(parts[0]);
            UUID destino = UUID.fromString(parts[1]);
            List<TipoVinculoRequisito> tipos = tiposPorCelula.getOrDefault(k, List.of());
            List<String> entidades = new ArrayList<>(entidadesPorCelula.getOrDefault(k, new LinkedHashSet<>()));
            TipoRelacaoMatriz tipoRelacao = classificar(!tipos.isEmpty(), !entidades.isEmpty());
            celulas.add(new CelulaMatrizDTO(origem, destino, tipoRelacao,
                    tipos.isEmpty() ? List.of() : List.copyOf(tipos),
                    entidades));
        }

        return new MatrizRastreabilidadeResponseDTO(projetoId, eixo, celulas);
    }

    // ── Análise de impacto (BFS) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AnaliseImpactoResponseDTO analisarImpacto(UUID requisitoId) {
        Requisito raiz = requisitoRepository.findById(requisitoId)
                .orElseThrow(() -> new RequisitoService.RequisitoNaoEncontradoException(requisitoId));
        UUID projetoId = raiz.getProjeto().getId();

        Map<UUID, Requisito> porId = new HashMap<>();
        for (Requisito r : requisitoRepository.findAllByProjetoId(projetoId)) {
            if (Boolean.TRUE.equals(r.getAtivo())) {
                porId.put(r.getId(), r);
            }
        }

        // Grafo não-direcionado: aresta -> tipo (DIRETO / INDIRETO / MISTO)
        Map<UUID, Map<UUID, TipoRelacaoMatriz>> adj = new HashMap<>();
        for (VinculoRequisito v : vinculoRequisitoRepository.findAllByProjetoId(projetoId)) {
            addEdge(adj, v.getRequisitoOrigem().getId(), v.getRequisitoDestino().getId(), TipoRelacaoMatriz.DIRETO);
        }
        for (Object[] row : impactoDadosRepository.findParesIndiretosByProjetoId(projetoId)) {
            addEdge(adj, (UUID) row[0], (UUID) row[1], TipoRelacaoMatriz.INDIRETO);
        }

        Map<UUID, Integer> dist = new HashMap<>();
        Map<UUID, UUID> pred = new HashMap<>();
        Map<UUID, TipoRelacaoMatriz> tipoAcumulado = new HashMap<>();
        Deque<UUID> fila = new ArrayDeque<>();
        dist.put(requisitoId, 0);
        fila.add(requisitoId);

        while (!fila.isEmpty()) {
            UUID atual = fila.poll();
            for (Map.Entry<UUID, TipoRelacaoMatriz> e : adj.getOrDefault(atual, Map.of()).entrySet()) {
                UUID vizinho = e.getKey();
                if (dist.containsKey(vizinho)) continue;
                dist.put(vizinho, dist.get(atual) + 1);
                pred.put(vizinho, atual);
                tipoAcumulado.put(vizinho, combinar(tipoAcumulado.get(atual), e.getValue()));
                fila.add(vizinho);
            }
        }

        List<RequisitoImpactadoDTO> impactados = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : dist.entrySet()) {
            UUID id = entry.getKey();
            if (id.equals(requisitoId)) continue;
            Requisito r = porId.get(id);
            if (r == null) continue;
            impactados.add(new RequisitoImpactadoDTO(
                    id,
                    r.getCodigo(),
                    r.getTitulo(),
                    r.getStatus() != null ? r.getStatus().getNome() : null,
                    entry.getValue(),
                    tipoAcumulado.getOrDefault(id, TipoRelacaoMatriz.DIRETO),
                    reconstruirCaminho(id, pred, porId)
            ));
        }
        impactados.sort(Comparator
                .comparingInt(RequisitoImpactadoDTO::distancia)
                .thenComparing(RequisitoImpactadoDTO::codigo, Comparator.nullsLast(Comparator.naturalOrder())));

        return new AnaliseImpactoResponseDTO(requisitoId, raiz.getCodigo(), raiz.getTitulo(), impactados);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addEdge(Map<UUID, Map<UUID, TipoRelacaoMatriz>> adj, UUID a, UUID b, TipoRelacaoMatriz tipo) {
        adj.computeIfAbsent(a, k -> new HashMap<>()).merge(b, tipo, this::combinar);
        adj.computeIfAbsent(b, k -> new HashMap<>()).merge(a, tipo, this::combinar);
    }

    private TipoRelacaoMatriz combinar(TipoRelacaoMatriz acc, TipoRelacaoMatriz proximo) {
        if (acc == null) return proximo;
        if (acc == proximo) return acc;
        return TipoRelacaoMatriz.MISTO;
    }

    private TipoRelacaoMatriz classificar(boolean temDireto, boolean temIndireto) {
        if (temDireto && temIndireto) return TipoRelacaoMatriz.MISTO;
        return temDireto ? TipoRelacaoMatriz.DIRETO : TipoRelacaoMatriz.INDIRETO;
    }

    private List<String> reconstruirCaminho(UUID destino, Map<UUID, UUID> pred, Map<UUID, Requisito> porId) {
        LinkedList<String> caminho = new LinkedList<>();
        UUID cursor = destino;
        while (cursor != null) {
            Requisito r = porId.get(cursor);
            caminho.addFirst(r != null ? r.getCodigo() : cursor.toString());
            cursor = pred.get(cursor);
        }
        return caminho;
    }

    private String chave(UUID origem, UUID destino) {
        return origem.toString() + "|" + destino.toString();
    }

    private RequisitoResumoDTO mapResumo(Requisito r) {
        return new RequisitoResumoDTO(
                r.getId(),
                r.getCodigo(),
                r.getTitulo(),
                r.getStatus() != null ? r.getStatus().getId() : null,
                r.getStatus() != null ? r.getStatus().getNome() : null
        );
    }
}
