package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.domain.EtapaPesquisa;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.ConfiguracaoPesquisaRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAbertaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.ResumoPesquisaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service.AdminPesquisaService;
import io.github.gubiogarcia.plataforma_governanca_software.shared.PaginaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

/**
 * Painel da pesquisa do TCC — só o Admin da Plataforma (conferido no service).
 *
 * GET /api/admin/pesquisa/resumo?excluirUsoPrevio=false            — contagens, itens e caracterização
 *     (excluirUsoPrevio=true desconsidera, nas estatísticas, quem respondeu o "antes" após usar a plataforma)
 * GET /api/admin/pesquisa/respostas-abertas?etapa=&pagina=&tamanho= — textos, só com o código do participante
 * PUT /api/admin/pesquisa/configuracao                              — {coletaAberta, intervaloMinimoMin}
 * GET /api/admin/pesquisa/exportacao                                — CSV anonimizado
 */
@RestController
@RequestMapping("/api/admin/pesquisa")
@RequiredArgsConstructor
public class AdminPesquisaController {

    private static final MediaType CSV = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final AdminPesquisaService adminPesquisaService;

    @GetMapping("/resumo")
    public ResponseEntity<ResumoPesquisaDTO> resumo(
            @RequestParam(defaultValue = "false") boolean excluirUsoPrevio
    ) {
        return ResponseEntity.ok(adminPesquisaService.resumo(excluirUsoPrevio));
    }

    @GetMapping("/respostas-abertas")
    public ResponseEntity<PaginaDTO<RespostaAbertaDTO>> respostasAbertas(
            @RequestParam(required = false)    EtapaPesquisa etapa,
            @RequestParam(defaultValue = "0")  int           pagina,
            @RequestParam(defaultValue = "20") int           tamanho
    ) {
        return ResponseEntity.ok(adminPesquisaService.respostasAbertas(etapa, pagina, tamanho));
    }

    @PutMapping("/configuracao")
    public ResponseEntity<ResumoPesquisaDTO> configurar(@RequestBody ConfiguracaoPesquisaRequestDTO dto) {
        return ResponseEntity.ok(adminPesquisaService.configurar(dto));
    }

    @GetMapping("/exportacao")
    public ResponseEntity<byte[]> exportar() {
        AdminPesquisaService.ArquivoPesquisa arquivo = adminPesquisaService.exportar();
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo.nomeArquivo(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.conteudo());
    }
}
