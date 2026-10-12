package io.github.gubiogarcia.plataforma_governanca_software.modules.export.service;

import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.AtributoEntidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.DiagramaProjetoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.dto.EntidadeDadosDetalheResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.datamodel.service.EntidadeDadosService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.domain.Projeto;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.repository.ProjetoRepository;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.domain.TipoSolicitacao;
import io.github.gubiogarcia.plataforma_governanca_software.modules.solicitation.service.SolicitacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.CelulaMatrizDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.MatrizRastreabilidadeResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.dto.RequisitoResumoDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.traceability.service.MatrizRastreabilidadeService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AcessoNegadoException;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.AutorizacaoService;
import io.github.gubiogarcia.plataforma_governanca_software.security.authz.Permissao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Exportação da modelagem de dados e da matriz de rastreabilidade em CSV (D11).
 *
 * Dono/Gestor exportam direto (MER_EXPORT / RASTREABILIDADE_EXPORT). Stakeholder só
 * exporta depois que uma solicitação de exportação dele foi ATENDIDA. O conteúdo é o
 * mesmo que ele já vê na tela: o controle é de processo/governança (quem pediu e
 * quem liberou), não de sigilo.
 *
 * CSV com ";" (padrão do Excel em pt-BR) e BOM UTF-8 para os acentos abrirem certos.
 */
@Service
@RequiredArgsConstructor
public class ExportacaoService {

    private static final String BOM = "﻿";
    private static final String SEP = ";";

    private final ProjetoRepository projetoRepository;
    private final EntidadeDadosService entidadeDadosService;
    private final MatrizRastreabilidadeService matrizRastreabilidadeService;
    private final SolicitacaoService solicitacaoService;
    private final AutorizacaoService autorizacao;

    public record ArquivoExportado(String nomeArquivo, byte[] conteudo) {}

    @Transactional(readOnly = true)
    public ArquivoExportado exportarMer(UUID projetoId) {
        Projeto projeto = carregarProjeto(projetoId);
        exigirExportacao(projeto, Permissao.MER_EXPORT, TipoSolicitacao.EXPORT_MER);

        DiagramaProjetoResponseDTO diagrama = entidadeDadosService.montarDiagrama(projetoId, null);
        StringBuilder csv = new StringBuilder(BOM)
                .append(linha("entidade", "descricao_entidade", "atributo", "tipo", "obrigatorio",
                        "chave_primaria", "chave_estrangeira", "entidade_referenciada", "tipo_relacionamento"));
        for (EntidadeDadosDetalheResponseDTO entidade : diagrama.entidades()) {
            if (entidade.atributos() == null || entidade.atributos().isEmpty()) {
                csv.append(linha(entidade.nome(), entidade.descricao(), "", "", "", "", "", "", ""));
                continue;
            }
            for (AtributoEntidadeResponseDTO a : entidade.atributos()) {
                csv.append(linha(entidade.nome(), entidade.descricao(), a.nome(), a.tipo(),
                        simNao(a.obrigatorio()), simNao(a.chavePrimaria()), simNao(a.chaveEstrangeira()),
                        a.entidadeReferenciadaNome(),
                        a.tipoRelacionamento() != null ? a.tipoRelacionamento().name() : ""));
            }
        }
        return new ArquivoExportado("modelagem-" + slug(projeto.getNome()) + ".csv",
                csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    @Transactional(readOnly = true)
    public ArquivoExportado exportarRastreabilidade(UUID projetoId) {
        Projeto projeto = carregarProjeto(projetoId);
        exigirExportacao(projeto, Permissao.RASTREABILIDADE_EXPORT, TipoSolicitacao.EXPORT_RASTREABILIDADE);

        MatrizRastreabilidadeResponseDTO matriz = matrizRastreabilidadeService.montarMatriz(projetoId);
        Map<UUID, RequisitoResumoDTO> requisitos = matriz.requisitos().stream()
                .collect(Collectors.toMap(RequisitoResumoDTO::id, Function.identity(), (a, b) -> a));

        StringBuilder csv = new StringBuilder(BOM)
                .append(linha("origem", "origem_titulo", "destino", "destino_titulo",
                        "tipo_relacao", "tipos_vinculo", "entidades_compartilhadas"));
        for (CelulaMatrizDTO c : matriz.celulas()) {
            RequisitoResumoDTO origem = requisitos.get(c.requisitoOrigemId());
            RequisitoResumoDTO destino = requisitos.get(c.requisitoDestinoId());
            csv.append(linha(
                    origem != null ? origem.codigo() : c.requisitoOrigemId().toString(),
                    origem != null ? origem.titulo() : "",
                    destino != null ? destino.codigo() : c.requisitoDestinoId().toString(),
                    destino != null ? destino.titulo() : "",
                    c.tipoRelacao() != null ? c.tipoRelacao().name() : "",
                    c.tiposVinculo() == null ? "" : c.tiposVinculo().stream().map(Enum::name).collect(Collectors.joining(", ")),
                    c.entidadesCompartilhadas() == null ? "" : String.join(", ", c.entidadesCompartilhadas())));
        }
        return new ArquivoExportado("rastreabilidade-" + slug(projeto.getNome()) + ".csv",
                csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private void exigirExportacao(Projeto projeto, Permissao exportarDireto, TipoSolicitacao solicitacao) {
        if (autorizacao.pode(projeto, exportarDireto)) return;
        if (autorizacao.pode(projeto, solicitacao.permissaoParaSolicitar())
                && solicitacaoService.exportacaoLiberada(projeto, solicitacao)) return;
        throw new AcessoNegadoException(autorizacao.pode(projeto, solicitacao.permissaoParaSolicitar())
                ? "Exportação ainda não liberada: solicite a exportação ao gestor do projeto."
                : "Você não tem permissão para exportar neste projeto.");
    }

    private Projeto carregarProjeto(UUID id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new SolicitacaoService.SolicitacaoNaoEncontradaException("Projeto não encontrado: " + id));
    }

    private static String linha(String... campos) {
        return java.util.Arrays.stream(campos).map(ExportacaoService::campo).collect(Collectors.joining(SEP)) + "\r\n";
    }

    /** Aspas quando o valor tem separador, aspas ou quebra de linha (RFC 4180). */
    private static String campo(String valor) {
        if (valor == null) return "";
        String v = valor.replace("\"", "\"\"");
        return (v.contains(SEP) || v.contains("\"") || v.contains("\n") || v.contains("\r")) ? "\"" + v + "\"" : v;
    }

    private static String simNao(Boolean b) {
        return Boolean.TRUE.equals(b) ? "sim" : "nao";
    }

    private static String slug(String nome) {
        String s = java.text.Normalizer.normalize(nome == null ? "projeto" : nome, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase();
        return s.isBlank() ? "projeto" : s.substring(0, Math.min(s.length(), 60));
    }
}
