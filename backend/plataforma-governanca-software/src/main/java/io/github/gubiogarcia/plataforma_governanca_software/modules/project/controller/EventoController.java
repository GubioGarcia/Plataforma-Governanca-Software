package io.github.gubiogarcia.plataforma_governanca_software.modules.project.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.AtualizarEventoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.CriarEventoRequestDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.dto.EventoResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.project.service.EventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evento")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    @PostMapping
    public ResponseEntity<EventoResponseDTO> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CriarEventoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoService.criar(jwt, request));
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<EventoResponseDTO>> listarPorProjeto(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(eventoService.listarPorProjeto(projetoId));
    }

    @GetMapping("/organizacao/{organizacaoId}")
    public ResponseEntity<List<EventoResponseDTO>> listarPorOrganizacao(@PathVariable UUID organizacaoId) {
        return ResponseEntity.ok(eventoService.listarPorOrganizacao(organizacaoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(eventoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventoResponseDTO> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarEventoRequestDTO request) {
        return ResponseEntity.ok(eventoService.atualizar(jwt, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        eventoService.deletar(jwt, id);
        return ResponseEntity.noContent().build();
    }
}
