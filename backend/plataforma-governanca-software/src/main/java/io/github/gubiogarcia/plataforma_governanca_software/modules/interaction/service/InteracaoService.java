package io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.Interacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.ModuloInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.domain.TipoInteracao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto.InteracaoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto.ResumoInteracaoProjetoDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.dto.ResumoInteracaoUsuarioDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.repository.InteracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteracaoService {

    private final InteracaoRepository interacaoRepository;
    private final UsuarioRepository   usuarioRepository;
    private final ProjetoRepository   projetoRepository;

    // ─── API interna (chamada pelos outros Services) ──────────────────────────

    /**
     * Registra uma interação de forma programática — sem Jwt.
     * Chamado internamente por ComentarioService, RequisitoService, VisaoProdutoService, EventoService.
     */
    @Transactional
    public void registrar(
            Usuario         usuario,
            Projeto         projeto,
            ModuloInteracao modulo,
            TipoInteracao   tipo,
            UUID            entidadeId,
            String          descricao
    ) {
        if (usuario == null || projeto == null) {
            log.warn("Interação ignorada: usuario ou projeto nulo (modulo={}, tipo={})", modulo, tipo);
            return;
        }

        Interacao interacao = Interacao.builder()
                .usuario(usuario)
                .projeto(projeto)
                .modulo(modulo)
                .tipo(tipo)
                .entidadeId(entidadeId)
                .descricao(descricao)
                .dataInteracao(Instant.now())
                .build();

        interacaoRepository.save(interacao);
        log.debug("Interação registrada: usuario={} projeto={} modulo={} tipo={}",
                usuario.getNome(), projeto.getNome(), modulo, tipo);
    }

    // ─── Listagens ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InteracaoResponseDTO> listarPorProjeto(UUID projetoId) {
        return interacaoRepository.findAllByProjetoId(projetoId)
                .stream()
                .sorted(Comparator.comparing(Interacao::getDataInteracao).reversed())
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InteracaoResponseDTO> listarPorUsuarioNoProjeto(UUID projetoId, UUID usuarioId) {
        return interacaoRepository.findAllByProjetoIdAndUsuarioId(projetoId, usuarioId)
                .stream()
                .sorted(Comparator.comparing(Interacao::getDataInteracao).reversed())
                .map(this::mapToDTO)
                .toList();
    }

    // ─── Resumo / Analytics ───────────────────────────────────────────────────

    /**
     * Retorna resumo completo de interações para um projeto:
     *   - total geral
     *   - breakdown por módulo
     *   - por usuário (com breakdown por módulo)
     * Usado pelo frontend na tela de Analytics e Stakeholders.
     */
    @Transactional(readOnly = true)
    public ResumoInteracaoProjetoDTO resumoPorProjeto(UUID projetoId) {
        // Total geral
        long total = interacaoRepository.countByProjetoId(projetoId);

        // Por módulo: modulo → count
        Map<String, Long> porModulo = new LinkedHashMap<>();
        for (Object[] row : interacaoRepository.countByProjetoGroupByModulo(projetoId)) {
            porModulo.put(row[0].toString(), (Long) row[1]);
        }

        // Por usuário e módulo: usuarioId → modulo → count
        Map<UUID, Map<ModuloInteracao, Long>> usuarioModuloMap = new HashMap<>();
        for (Object[] row : interacaoRepository.countByProjetoGroupByUsuarioAndModulo(projetoId)) {
            UUID uid        = (UUID) row[0];
            ModuloInteracao mod = (ModuloInteracao) row[1];
            long cnt        = (Long) row[2];
            usuarioModuloMap.computeIfAbsent(uid, k -> new EnumMap<>(ModuloInteracao.class)).put(mod, cnt);
        }

        // Total por usuário: usuarioId → total
        Map<UUID, Long> usuarioTotalMap = new HashMap<>();
        for (Object[] row : interacaoRepository.countByProjetoGroupByUsuario(projetoId)) {
            usuarioTotalMap.put((UUID) row[0], (Long) row[1]);
        }

        // Monta lista de resumo por usuário
        Set<UUID> todosUsuarioIds = new HashSet<>(usuarioTotalMap.keySet());
        todosUsuarioIds.addAll(usuarioModuloMap.keySet());

        List<ResumoInteracaoUsuarioDTO> porUsuario = new ArrayList<>();
        for (UUID uid : todosUsuarioIds) {
            Usuario u = usuarioRepository.findById(uid).orElse(null);
            if (u == null) continue;

            Map<ModuloInteracao, Long> mods = usuarioModuloMap.getOrDefault(uid, Collections.emptyMap());
            porUsuario.add(new ResumoInteracaoUsuarioDTO(
                    uid,
                    u.getNome(),
                    u.getEmail(),
                    u.getUrlMidiaPerfil(),
                    usuarioTotalMap.getOrDefault(uid, 0L),
                    mods.getOrDefault(ModuloInteracao.WIKI, 0L),
                    mods.getOrDefault(ModuloInteracao.REQUISITO, 0L),
                    mods.getOrDefault(ModuloInteracao.COMENTARIO, 0L),
                    mods.getOrDefault(ModuloInteracao.EVENTO, 0L)
            ));
        }

        porUsuario.sort(Comparator.comparingLong(ResumoInteracaoUsuarioDTO::totalInteracoes).reversed());

        return new ResumoInteracaoProjetoDTO(
                total,
                (long) todosUsuarioIds.size(),
                porModulo,
                porUsuario
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private InteracaoResponseDTO mapToDTO(Interacao i) {
        return new InteracaoResponseDTO(
                i.getId(),
                i.getUsuario().getId(),
                i.getUsuario().getNome(),
                i.getUsuario().getUrlMidiaPerfil(),
                i.getProjeto().getId(),
                i.getModulo(),
                i.getTipo(),
                i.getEntidadeId(),
                i.getDescricao(),
                i.getDataInteracao()
        );
    }
}
