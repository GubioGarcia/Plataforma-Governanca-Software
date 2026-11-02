package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.domain.Usuario;
import io.github.gubiogarcia.plataforma_governanca_software.modules.identity.repository.UsuarioRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.interaction.repository.InteracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.*;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.EstadoPesquisa;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAntesRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaDepoisRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.SituacaoPesquisaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaConfiguracaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaParticipacaoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.repository.PesquisaRespostaRepository;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Pesquisa do TCC do ponto de vista do participante: situação, etapa "antes"
 * (com consentimento e caracterização), etapa "depois" e retirada.
 *
 * Regras:
 *  - o público é quem é Dono ou Gestor de alguma organização ou projeto; o Admin
 *    da Plataforma não participa (situação NAO_ELEGIVEL; 403 nos envios);
 *  - o "antes" é oferecido a cada login até ser respondido (o "Responder depois"
 *    do frontend só adia, não grava nada);
 *  - o "depois" exige o "antes", o intervalo mínimo cumprido e a coleta aberta, e
 *    continua liberado mesmo que a pessoa tenha perdido o papel (não perde o par);
 *  - cada etapa é respondida uma vez (UNIQUE no banco → 409, cobre duplo clique);
 *  - ao gravar o "antes", registra se o usuário já tinha interações na plataforma
 *    (usou_plataforma_antes), para a análise separar respostas possivelmente
 *    influenciadas pelo uso. O valor é calculado aqui; nenhum DTO de entrada o aceita;
 *  - a retirada apaga as respostas, deixa a linha sem código nem dados para não
 *    perguntar de novo e vale mesmo com a coleta encerrada.
 *
 * As respostas não vão para interacao nem para auditoria, e os logs registram só
 * o id da participação e a etapa, nunca o conteúdo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PesquisaService {

    private final AutorizacaoService autorizacao;
    private final UsuarioRepository usuarioRepository;
    private final PesquisaConfiguracaoRepository configuracaoRepository;
    private final PesquisaParticipacaoRepository participacaoRepository;
    private final PesquisaRespostaRepository respostaRepository;
    private final InteracaoRepository interacaoRepository;

    @Transactional(readOnly = true)
    public SituacaoPesquisaDTO situacao() {
        PesquisaConfiguracao config = configuracao();
        if (autorizacao.isAdminPlataforma()) {
            return montar(EstadoPesquisa.NAO_ELEGIVEL, null, Map.of(), config);
        }
        Usuario usuario = usuarioAtual();
        Optional<PesquisaParticipacao> participacao = participacaoRepository.findByUsuarioId(usuario.getId());
        if (participacao.isEmpty()) {
            boolean elegivel = config.getColetaAberta() && autorizacao.isDonoOuGestor();
            return montar(elegivel ? EstadoPesquisa.PENDENTE_ANTES : EstadoPesquisa.NAO_ELEGIVEL, null, Map.of(), config);
        }
        PesquisaParticipacao p = participacao.get();
        Map<EtapaPesquisa, PesquisaResposta> respostas = respostasPorEtapa(p);
        return montar(estado(p, respostas, config), p, respostas, config);
    }

    @Transactional
    public SituacaoPesquisaDTO responderAntes(RespostaAntesRequestDTO dto) {
        Usuario usuario = participanteAtual();
        if (!autorizacao.isDonoOuGestor()) {
            throw new AcessoNegadoException("A pesquisa é respondida por donos e gestores de organizações ou projetos.");
        }
        exigirColetaAberta();
        if (!Boolean.TRUE.equals(dto.consentimento())) {
            throw new RespostaPesquisaInvalidaException("É preciso concordar com o termo para participar.");
        }
        short[] itens = validarItens(dto.itens());
        String aberta = validarAberta(dto.respostaAberta());
        if (dto.funcao() == null || dto.tempoExperiencia() == null) {
            throw new RespostaPesquisaInvalidaException("Informe a sua função e o seu tempo de experiência.");
        }
        String ferramentaOutro = textoOuNulo(dto.ferramentaOutro());
        if (ferramentaOutro != null && ferramentaOutro.length() > InstrumentoPesquisa.TAMANHO_MAXIMO_FERRAMENTA_OUTRO) {
            throw new RespostaPesquisaInvalidaException("O nome da outra ferramenta deve ter no máximo "
                    + InstrumentoPesquisa.TAMANHO_MAXIMO_FERRAMENTA_OUTRO + " caracteres.");
        }
        EnumSet<Ferramenta> ferramentas = dto.ferramentas() == null || dto.ferramentas().isEmpty()
                ? EnumSet.noneOf(Ferramenta.class) : EnumSet.copyOf(dto.ferramentas());
        if (ferramentaOutro != null) ferramentas.add(Ferramenta.OUTRA);

        if (participacaoRepository.findByUsuarioId(usuario.getId()).isPresent()) {
            throw new PesquisaConflitoException("Você já respondeu a esta etapa da pesquisa.");
        }

        Instant agora = Instant.now();
        PesquisaParticipacao participacao = PesquisaParticipacao.builder()
                .usuario(usuario)
                .situacao(SituacaoParticipacao.PARTICIPANDO)
                .codigo(String.format("P-%03d", participacaoRepository.proximoNumeroCodigo()))
                .versaoInstrumento(InstrumentoPesquisa.vigente().versao())
                .consentimentoEm(agora)
                .funcao(dto.funcao())
                .tempoExperiencia(dto.tempoExperiencia())
                .ferramentas(ferramentas)
                .ferramentaOutro(ferramentas.contains(Ferramenta.OUTRA) ? ferramentaOutro : null)
                .usouPlataformaAntes(interacaoRepository.existsByUsuarioId(usuario.getId()))
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();
        try {
            participacaoRepository.saveAndFlush(participacao);
            respostaRepository.saveAndFlush(resposta(participacao, EtapaPesquisa.ANTES, itens, aberta, agora));
        } catch (DataIntegrityViolationException e) {
            throw new PesquisaConflitoException("Você já respondeu a esta etapa da pesquisa.");
        }
        log.info("Pesquisa: participação {} respondeu a etapa ANTES", participacao.getId());
        return situacao();
    }

    @Transactional
    public SituacaoPesquisaDTO responderDepois(RespostaDepoisRequestDTO dto) {
        Usuario usuario = participanteAtual();
        PesquisaConfiguracao config = exigirColetaAberta();
        short[] itens = validarItens(dto.itens());
        String aberta = validarAberta(dto.respostaAberta());

        PesquisaParticipacao participacao = participacaoRepository.findByUsuarioId(usuario.getId())
                .filter(p -> p.getSituacao() == SituacaoParticipacao.PARTICIPANDO)
                .orElseThrow(() -> new PesquisaConflitoException("Responda primeiro à etapa inicial da pesquisa."));
        Map<EtapaPesquisa, PesquisaResposta> respostas = respostasPorEtapa(participacao);
        PesquisaResposta antes = respostas.get(EtapaPesquisa.ANTES);
        if (antes == null) {
            throw new PesquisaConflitoException("Responda primeiro à etapa inicial da pesquisa.");
        }
        if (respostas.containsKey(EtapaPesquisa.DEPOIS)) {
            throw new PesquisaConflitoException("Você já respondeu a esta etapa da pesquisa.");
        }
        Instant agora = Instant.now();
        if (agora.isBefore(depoisDisponivelEm(antes, config))) {
            throw new PesquisaConflitoException("A segunda etapa ainda não está disponível. Use a plataforma e volte mais tarde.");
        }
        try {
            respostaRepository.saveAndFlush(resposta(participacao, EtapaPesquisa.DEPOIS, itens, aberta, agora));
        } catch (DataIntegrityViolationException e) {
            throw new PesquisaConflitoException("Você já respondeu a esta etapa da pesquisa.");
        }
        participacao.setAtualizadoEm(agora);
        log.info("Pesquisa: participação {} respondeu a etapa DEPOIS", participacao.getId());
        return situacao();
    }

    /** Apaga as respostas, a caracterização e a marcação de uso prévio; vale mesmo com a coleta encerrada. */
    @Transactional
    public SituacaoPesquisaDTO retirar() {
        Usuario usuario = participanteAtual();
        PesquisaParticipacao participacao = participacaoRepository.findByUsuarioId(usuario.getId())
                .filter(p -> p.getSituacao() == SituacaoParticipacao.PARTICIPANDO)
                .orElseThrow(() -> new PesquisaConflitoException("Você não tem participação ativa na pesquisa."));
        respostaRepository.apagarDaParticipacao(participacao.getId());
        participacao.setSituacao(SituacaoParticipacao.RETIRADA);
        participacao.setCodigo(null);
        participacao.setConsentimentoEm(null);
        participacao.setFuncao(null);
        participacao.setTempoExperiencia(null);
        participacao.getFerramentas().clear();
        participacao.setFerramentaOutro(null);
        participacao.setUsouPlataformaAntes(null);
        participacao.setAtualizadoEm(Instant.now());
        participacaoRepository.saveAndFlush(participacao);
        log.info("Pesquisa: participação {} retirada", participacao.getId());
        return situacao();
    }

    // ── Estado ────────────────────────────────────────────────────────────────

    private EstadoPesquisa estado(PesquisaParticipacao p, Map<EtapaPesquisa, PesquisaResposta> respostas,
                                  PesquisaConfiguracao config) {
        return switch (p.getSituacao()) {
            case RETIRADA -> EstadoPesquisa.RETIRADA;
            case PARTICIPANDO -> {
                PesquisaResposta antes = respostas.get(EtapaPesquisa.ANTES);
                if (respostas.containsKey(EtapaPesquisa.DEPOIS)) yield EstadoPesquisa.CONCLUIDA;
                if (antes == null || !config.getColetaAberta()) yield EstadoPesquisa.NAO_ELEGIVEL;
                yield Instant.now().isBefore(depoisDisponivelEm(antes, config))
                        ? EstadoPesquisa.AGUARDANDO_DEPOIS : EstadoPesquisa.PENDENTE_DEPOIS;
            }
        };
    }

    private SituacaoPesquisaDTO montar(EstadoPesquisa estado, PesquisaParticipacao p,
                                       Map<EtapaPesquisa, PesquisaResposta> respostas, PesquisaConfiguracao config) {
        PesquisaResposta antes = respostas.get(EtapaPesquisa.ANTES);
        PesquisaResposta depois = respostas.get(EtapaPesquisa.DEPOIS);
        return new SituacaoPesquisaDTO(
                estado,
                p != null ? p.getSituacao() : null,
                p != null ? p.getCodigo() : null,
                antes != null ? antes.getRespondidaEm() : null,
                depois != null ? depois.getRespondidaEm() : null,
                antes != null && depois == null ? depoisDisponivelEm(antes, config) : null,
                config.getColetaAberta(),
                InstrumentoPesquisa.vigente());
    }

    private static Instant depoisDisponivelEm(PesquisaResposta antes, PesquisaConfiguracao config) {
        return antes.getRespondidaEm().plus(Duration.ofMinutes(config.getIntervaloMinimoMin()));
    }

    private Map<EtapaPesquisa, PesquisaResposta> respostasPorEtapa(PesquisaParticipacao p) {
        return respostaRepository.findAllByParticipacaoId(p.getId()).stream()
                .collect(Collectors.toMap(PesquisaResposta::getEtapa, Function.identity()));
    }

    // ── Configuração e usuário ────────────────────────────────────────────────

    /** A linha única vem da V5; sem ela (ex.: banco dos testes), vale a coleta fechada. */
    PesquisaConfiguracao configuracao() {
        return configuracaoRepository.findById(PesquisaConfiguracao.ID)
                .orElseGet(() -> PesquisaConfiguracao.builder()
                        .id(PesquisaConfiguracao.ID)
                        .coletaAberta(false)
                        .intervaloMinimoMin(15)
                        .atualizadoEm(Instant.now())
                        .build());
    }

    private PesquisaConfiguracao exigirColetaAberta() {
        PesquisaConfiguracao config = configuracao();
        if (!config.getColetaAberta()) throw new PesquisaConflitoException("A coleta está encerrada.");
        return config;
    }

    private Usuario usuarioAtual() {
        Usuario usuario = usuarioRepository.findByExternalIdentityId(autorizacao.keycloakIdAtual())
                .orElseThrow(() -> new AcessoNegadoException("Usuário autenticado não encontrado na plataforma."));
        if (Boolean.FALSE.equals(usuario.getAtivo())) {
            throw new AcessoNegadoException("Conta inativa.");
        }
        return usuario;
    }

    /** Quem pode enviar respostas: qualquer usuário ativo, menos o Admin da Plataforma. */
    private Usuario participanteAtual() {
        if (autorizacao.isAdminPlataforma()) {
            throw new AcessoNegadoException("O administrador da plataforma não participa da pesquisa.");
        }
        return usuarioAtual();
    }

    // ── Validação ─────────────────────────────────────────────────────────────

    private static short[] validarItens(List<Integer> itens) {
        if (itens == null || itens.size() != InstrumentoPesquisa.QUANTIDADE_ITENS
                || itens.stream().anyMatch(i -> i == null || i < 1 || i > 5)) {
            throw new RespostaPesquisaInvalidaException(
                    "Responda às " + InstrumentoPesquisa.QUANTIDADE_ITENS + " afirmações com um valor de 1 a 5.");
        }
        short[] valores = new short[itens.size()];
        for (int i = 0; i < valores.length; i++) valores[i] = itens.get(i).shortValue();
        return valores;
    }

    private static String validarAberta(String texto) {
        String aberta = textoOuNulo(texto);
        if (aberta != null && aberta.length() > InstrumentoPesquisa.TAMANHO_MAXIMO_ABERTA) {
            throw new RespostaPesquisaInvalidaException("A resposta aberta deve ter no máximo "
                    + InstrumentoPesquisa.TAMANHO_MAXIMO_ABERTA + " caracteres.");
        }
        return aberta;
    }

    private static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.strip();
    }

    private static PesquisaResposta resposta(PesquisaParticipacao participacao, EtapaPesquisa etapa,
                                             short[] itens, String aberta, Instant agora) {
        return PesquisaResposta.builder()
                .participacao(participacao)
                .etapa(etapa)
                .item1(itens[0]).item2(itens[1]).item3(itens[2]).item4(itens[3]).item5(itens[4])
                .respostaAberta(aberta)
                .respondidaEm(agora)
                .build();
    }

    // ── Exceções ──────────────────────────────────────────────────────────────

    /** 409: etapa já respondida, fora de ordem, antes do intervalo ou coleta encerrada. */
    public static class PesquisaConflitoException extends RuntimeException {
        public PesquisaConflitoException(String mensagem) { super(mensagem); }
    }

    /** 400: resposta incompleta ou fora dos limites. */
    public static class RespostaPesquisaInvalidaException extends RuntimeException {
        public RespostaPesquisaInvalidaException(String mensagem) { super(mensagem); }
    }
}
