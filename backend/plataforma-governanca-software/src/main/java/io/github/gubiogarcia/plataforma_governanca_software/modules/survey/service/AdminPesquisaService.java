package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.service.AdminService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.ConfiguracaoPesquisaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAbertaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.ResumoPesquisaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaConfiguracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaParticipacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaRespostaRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.shared.CsvUtil;
import io.github.gubiogarcia.plataforma_governanca_software.shared.PaginaDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static io.github.gubiogarcia.plataforma_governanca_software.shared.CsvUtil.linha;

/**
 * Painel da pesquisa (Admin da Plataforma): abre e encerra a coleta, mostra a
 * estatística descritiva (distribuição e mediana por item, comparação pareada) e
 * exporta o CSV anonimizado. Testes estatísticos (ex.: Wilcoxon) são feitos fora,
 * sobre o CSV.
 *
 * Fora do banco os participantes só aparecem pelo código; retiradas não têm
 * respostas e não entram no CSV. Abrir/encerrar, mudar o intervalo e exportar
 * vão para a auditoria administrativa.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPesquisaService {

    static final String TIPO_AUDITORIA = "PESQUISA";
    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATA_CSV = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(FUSO);

    private final AutorizacaoService autorizacao;
    private final AuditoriaService auditoria;
    private final UsuarioRepository usuarioRepository;
    private final PesquisaConfiguracaoRepository configuracaoRepository;
    private final PesquisaParticipacaoRepository participacaoRepository;
    private final PesquisaRespostaRepository respostaRepository;
    private final PesquisaService pesquisaService;

    public record ArquivoPesquisa(String nomeArquivo, byte[] conteudo, int linhas) {}

    @Transactional(readOnly = true)
    public ResumoPesquisaDTO resumo() {
        autorizacao.exigirAdminPlataforma();
        PesquisaConfiguracao config = pesquisaService.configuracao();
        List<PesquisaParticipacao> todas = participacaoRepository.findAll();
        List<PesquisaParticipacao> participando = todas.stream()
                .filter(p -> p.getSituacao() == SituacaoParticipacao.PARTICIPANDO).toList();
        Map<UUID, Map<EtapaPesquisa, PesquisaResposta>> respostas = respostasPorParticipacao();

        List<PesquisaResposta> antes = etapa(respostas, EtapaPesquisa.ANTES);
        List<PesquisaResposta> depois = etapa(respostas, EtapaPesquisa.DEPOIS);
        List<PesquisaResposta[]> pares = respostas.values().stream()
                .filter(r -> r.containsKey(EtapaPesquisa.ANTES) && r.containsKey(EtapaPesquisa.DEPOIS))
                .map(r -> new PesquisaResposta[]{r.get(EtapaPesquisa.ANTES), r.get(EtapaPesquisa.DEPOIS)})
                .toList();

        InstrumentoPesquisa.Versao instrumento = InstrumentoPesquisa.vigente();
        List<ResumoPesquisaDTO.Item> itens = instrumento.itens().stream().map(item -> {
            int i = item.numero() - 1;
            return new ResumoPesquisaDTO.Item(item.numero(), item.textoAntes(), item.textoDepois(),
                    distribuicao(antes.stream().map(r -> (int) r.itens()[i]).toList()),
                    distribuicao(depois.stream().map(r -> (int) r.itens()[i]).toList()),
                    pareado(pares.stream().map(p -> p[1].itens()[i] - p[0].itens()[i]).toList()));
        }).toList();

        return new ResumoPesquisaDTO(
                config.getColetaAberta(), config.getAbertaEm(), config.getEncerradaEm(), config.getIntervaloMinimoMin(),
                participando.size(),
                todas.stream().filter(p -> p.getSituacao() == SituacaoParticipacao.RETIRADA).count(),
                antes.size(), depois.size(), pares.size(),
                itens,
                contagem(FuncaoParticipante.values(), FuncaoParticipante::rotulo,
                        participando.stream().map(PesquisaParticipacao::getFuncao)),
                contagem(TempoExperiencia.values(), TempoExperiencia::rotulo,
                        participando.stream().map(PesquisaParticipacao::getTempoExperiencia)),
                contagem(Ferramenta.values(), Ferramenta::rotulo,
                        participando.stream().flatMap(p -> p.getFerramentas().stream())));
    }

    @Transactional(readOnly = true)
    public PaginaDTO<RespostaAbertaDTO> respostasAbertas(EtapaPesquisa etapa, int pagina, int tamanho) {
        autorizacao.exigirAdminPlataforma();
        var page = respostaRepository.listarAbertas(etapa, PageRequest.of(
                Math.max(pagina, 0), Math.clamp(tamanho, 1, AdminService.TAMANHO_MAXIMO_PAGINA)));
        return PaginaDTO.de(page, r -> new RespostaAbertaDTO(
                r.getParticipacao().getCodigo(), r.getEtapa(), r.getRespostaAberta(), r.getRespondidaEm()));
    }

    @Transactional
    public ResumoPesquisaDTO configurar(ConfiguracaoPesquisaRequestDTO dto) {
        autorizacao.exigirAdminPlataforma();
        if (dto.coletaAberta() == null || dto.intervaloMinimoMin() == null
                || dto.intervaloMinimoMin() < 0 || dto.intervaloMinimoMin() > 1440) {
            throw new ConfiguracaoPesquisaInvalidaException(
                    "Informe se a coleta está aberta e um intervalo mínimo entre 0 e 1440 minutos.");
        }
        PesquisaConfiguracao config = pesquisaService.configuracao();
        Instant agora = Instant.now();
        boolean estavaAberta = config.getColetaAberta();
        int intervaloAnterior = config.getIntervaloMinimoMin();

        if (dto.coletaAberta() != estavaAberta) {
            if (dto.coletaAberta()) config.setAbertaEm(agora);
            else config.setEncerradaEm(agora);
            config.setColetaAberta(dto.coletaAberta());
            auditoria.registrarAdministrativa(TIPO_AUDITORIA, null, AcaoAuditoria.EDICAO, "coleta",
                    rotuloColeta(estavaAberta), rotuloColeta(dto.coletaAberta()));
        }
        if (dto.intervaloMinimoMin() != intervaloAnterior) {
            config.setIntervaloMinimoMin(dto.intervaloMinimoMin());
            auditoria.registrarAdministrativa(TIPO_AUDITORIA, null, AcaoAuditoria.EDICAO, "intervaloMinimo",
                    intervaloAnterior + " min", dto.intervaloMinimoMin() + " min");
        }
        config.setAtualizadoPor(usuarioRepository.findByExternalIdentityId(autorizacao.keycloakIdAtual()).orElse(null));
        config.setAtualizadoEm(agora);
        configuracaoRepository.save(config);
        return resumo();
    }

    /**
     * Uma linha por participante (só PARTICIPANDO), identificado pelo código. Datas no
     * horário de Brasília; ferramentas separadas por "|".
     */
    @Transactional
    public ArquivoPesquisa exportar() {
        autorizacao.exigirAdminPlataforma();
        Map<UUID, Map<EtapaPesquisa, PesquisaResposta>> respostas = respostasPorParticipacao();
        List<PesquisaParticipacao> participantes = participacaoRepository.findAll().stream()
                .filter(p -> p.getSituacao() == SituacaoParticipacao.PARTICIPANDO && p.getCodigo() != null)
                .sorted(Comparator.comparing(PesquisaParticipacao::getCodigo))
                .toList();

        List<Object> cabecalho = new ArrayList<>(List.of("codigo", "versao", "funcao", "tempo_experiencia",
                "ferramentas", "ferramenta_outro", "antes_em"));
        IntStream.rangeClosed(1, 5).forEach(i -> cabecalho.add("antes_i" + i));
        cabecalho.addAll(List.of("antes_aberta", "depois_em"));
        IntStream.rangeClosed(1, 5).forEach(i -> cabecalho.add("depois_i" + i));
        cabecalho.add("depois_aberta");

        StringBuilder csv = new StringBuilder(CsvUtil.BOM).append(linha(cabecalho.toArray()));
        for (PesquisaParticipacao p : participantes) {
            Map<EtapaPesquisa, PesquisaResposta> r = respostas.getOrDefault(p.getId(), Map.of());
            List<Object> celulas = new ArrayList<>(List.of(
                    p.getCodigo(), p.getVersaoInstrumento(),
                    p.getFuncao() != null ? p.getFuncao().name() : "",
                    p.getTempoExperiencia() != null ? p.getTempoExperiencia().name() : "",
                    p.getFerramentas().stream().map(Enum::name).sorted().collect(Collectors.joining("|")),
                    Objects.toString(p.getFerramentaOutro(), "")));
            celulas.addAll(etapaCsv(r.get(EtapaPesquisa.ANTES)));
            celulas.addAll(etapaCsv(r.get(EtapaPesquisa.DEPOIS)));
            csv.append(linha(celulas.toArray()));
        }

        auditoria.registrarAdministrativa(TIPO_AUDITORIA, null, AcaoAuditoria.CRIACAO, "exportacaoCsv",
                null, participantes.size() + " linha(s)");
        log.info("Pesquisa: CSV exportado com {} linha(s)", participantes.size());
        return new ArquivoPesquisa("pesquisa-tcc-respostas.csv",
                csv.toString().getBytes(StandardCharsets.UTF_8), participantes.size());
    }

    // ── Estatística descritiva ────────────────────────────────────────────────

    static ResumoPesquisaDTO.Distribuicao distribuicao(List<Integer> valores) {
        int[] contagem = new int[5];
        valores.forEach(v -> contagem[v - 1]++);
        return new ResumoPesquisaDTO.Distribuicao(valores.size(),
                Arrays.stream(contagem).boxed().toList(), mediana(valores));
    }

    static ResumoPesquisaDTO.Pareado pareado(List<Integer> diferencas) {
        return new ResumoPesquisaDTO.Pareado(diferencas.size(), mediana(diferencas),
                (int) diferencas.stream().filter(d -> d > 0).count(),
                (int) diferencas.stream().filter(d -> d == 0).count(),
                (int) diferencas.stream().filter(d -> d < 0).count());
    }

    /** Mediana; com quantidade par, a média dos dois valores centrais. Nula sem valores. */
    static Double mediana(List<Integer> valores) {
        if (valores.isEmpty()) return null;
        List<Integer> ordenados = valores.stream().sorted().toList();
        int meio = ordenados.size() / 2;
        return ordenados.size() % 2 == 1
                ? ordenados.get(meio).doubleValue()
                : (ordenados.get(meio - 1) + ordenados.get(meio)) / 2.0;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<UUID, Map<EtapaPesquisa, PesquisaResposta>> respostasPorParticipacao() {
        return respostaRepository.findAll().stream().collect(Collectors.groupingBy(
                r -> r.getParticipacao().getId(),
                Collectors.toMap(PesquisaResposta::getEtapa, Function.identity())));
    }

    private static List<PesquisaResposta> etapa(Map<UUID, Map<EtapaPesquisa, PesquisaResposta>> respostas, EtapaPesquisa etapa) {
        return respostas.values().stream().map(r -> r.get(etapa)).filter(Objects::nonNull).toList();
    }

    private static <E extends Enum<E>> List<ResumoPesquisaDTO.Contagem> contagem(
            E[] valores, Function<E, String> rotulo, java.util.stream.Stream<E> marcados) {
        Map<E, Long> porValor = marcados.filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        return Arrays.stream(valores)
                .map(e -> new ResumoPesquisaDTO.Contagem(e.name(), rotulo.apply(e), porValor.getOrDefault(e, 0L)))
                .toList();
    }

    private static List<Object> etapaCsv(PesquisaResposta r) {
        if (r == null) return Collections.nCopies(7, "");
        List<Object> celulas = new ArrayList<>();
        celulas.add(DATA_CSV.format(r.getRespondidaEm()));
        for (short v : r.itens()) celulas.add(v);
        celulas.add(Objects.toString(r.getRespostaAberta(), ""));
        return celulas;
    }

    private static String rotuloColeta(boolean aberta) {
        return aberta ? "Aberta" : "Encerrada";
    }

    /** 400: configuração fora dos limites. */
    public static class ConfiguracaoPesquisaInvalidaException extends RuntimeException {
        public ConfiguracaoPesquisaInvalidaException(String mensagem) { super(mensagem); }
    }
}
