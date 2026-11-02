package io.github.gubiogarcia.plataforma_governanca_software.modules.survey.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaAntesRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.RespostaDepoisRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.dto.SituacaoPesquisaDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.survey.service.PesquisaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Pesquisa do TCC (participante). Todos os endpoints exigem usuário autenticado e
 * ativo; o Admin da Plataforma recebe 403 nos envios e só Dono ou Gestor responde
 * o "antes". Cada envio devolve a situação atualizada.
 *
 * GET    /api/pesquisa/situacao             — estado do usuário + instrumento vigente
 * POST   /api/pesquisa/antes                — consentimento, 5 itens, aberta e caracterização
 * POST   /api/pesquisa/depois               — 5 itens e aberta
 * DELETE /api/pesquisa/minha-participacao   — retirar a participação (apaga as respostas)
 */
@RestController
@RequestMapping("/api/pesquisa")
@RequiredArgsConstructor
public class PesquisaController {

    private final PesquisaService pesquisaService;

    @GetMapping("/situacao")
    public ResponseEntity<SituacaoPesquisaDTO> situacao() {
        return ResponseEntity.ok(pesquisaService.situacao());
    }

    @PostMapping("/antes")
    public ResponseEntity<SituacaoPesquisaDTO> antes(@RequestBody RespostaAntesRequestDTO dto) {
        return ResponseEntity.ok(pesquisaService.responderAntes(dto));
    }

    @PostMapping("/depois")
    public ResponseEntity<SituacaoPesquisaDTO> depois(@RequestBody RespostaDepoisRequestDTO dto) {
        return ResponseEntity.ok(pesquisaService.responderDepois(dto));
    }

    @DeleteMapping("/minha-participacao")
    public ResponseEntity<SituacaoPesquisaDTO> retirar() {
        return ResponseEntity.ok(pesquisaService.retirar());
    }
}
