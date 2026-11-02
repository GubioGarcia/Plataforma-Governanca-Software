package io.github.gubiogarcia.plataforma_governanca_software.modules.admin.controller;

import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto.ResumoAdminDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto.UsuarioAdminDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.admin.service.AdminService;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.domain.AcaoAuditoria;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.dto.AuditoriaResponseDTO;
import io.github.gubiogarcia.plataforma_governanca_software.modules.audit.service.AuditoriaService;
import io.github.gubiogarcia.plataforma_governanca_software.shared.PaginaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * Área administrativa — todos os endpoints exigem o Admin da Plataforma (grupo /_admin),
 * conferido nos services.
 *
 * GET /api/admin/resumo                                          — contagens gerais
 * GET /api/admin/usuarios?pagina=&tamanho=&busca=&ativo=         — contas (paginado)
 * GET /api/admin/auditoria?pagina=&tamanho=&acao=&de=&ate=       — ações administrativas
 *
 * A inativação usa DELETE /api/usuario/{id}; dados de referência usam
 * /api/status-projeto, /api/status-requisito e /api/prioridade.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AuditoriaService auditoriaService;

    @GetMapping("/resumo")
    public ResponseEntity<ResumoAdminDTO> resumo() {
        return ResponseEntity.ok(adminService.resumo());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<PaginaDTO<UsuarioAdminDTO>> usuarios(
            @RequestParam(defaultValue = "0")  int     pagina,
            @RequestParam(defaultValue = "20") int     tamanho,
            @RequestParam(required = false)    String  busca,
            @RequestParam(required = false)    Boolean ativo
    ) {
        return ResponseEntity.ok(adminService.usuarios(pagina, tamanho, busca, ativo));
    }

    /** de/ate em ISO-8601 (ex.: 2026-11-01T03:00:00Z); ate é exclusivo. */
    @GetMapping("/auditoria")
    public ResponseEntity<PaginaDTO<AuditoriaResponseDTO>> auditoria(
            @RequestParam(defaultValue = "0")  int           pagina,
            @RequestParam(defaultValue = "20") int           tamanho,
            @RequestParam(required = false)    AcaoAuditoria acao,
            @RequestParam(required = false)    Instant       de,
            @RequestParam(required = false)    Instant       ate
    ) {
        return ResponseEntity.ok(auditoriaService.listarAdministrativa(pagina, tamanho, acao, de, ate));
    }
}
