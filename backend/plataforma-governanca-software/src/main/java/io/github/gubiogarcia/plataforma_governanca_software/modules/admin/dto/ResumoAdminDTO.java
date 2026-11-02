package io.github.gubiogarcia.plataforma_governanca_software.modules.admin.dto;

import java.util.Map;

/**
 * Visão geral da plataforma para o Admin: só contagens, nada de conteúdo de projeto.
 * As contas de Admin da Plataforma não entram nas contagens de usuários.
 */
public record ResumoAdminDTO(
        long              usuariosAtivos,
        long              usuariosInativos,
        long              organizacoes,
        long              projetos,
        Map<String, Long> requisitosPorStatus,
        long              solicitacoesPendentes
) {}
