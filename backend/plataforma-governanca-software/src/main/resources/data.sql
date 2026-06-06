-- =============================================================================
-- data.sql — Seed dos dados de referência
--
-- Executado pelo Spring Boot APÓS o Hibernate criar/atualizar as tabelas
-- (spring.jpa.defer-datasource-initialization=true).
--
-- Idempotente: ON CONFLICT (id) DO NOTHING garante segurança em re-execuções.
-- Roda em TODA inicialização (spring.sql.init.mode=always).
-- =============================================================================

-- ─── STATUS PROJETO ──────────────────────────────────────────────────────────

INSERT INTO status_projeto (id, nome, descricao, ordem) VALUES
    ('a1000001-0000-0000-0000-000000000001', 'RASCUNHO',     'Projeto em elaboração inicial',       1),
    ('a1000001-0000-0000-0000-000000000002', 'EM_REVISAO',   'Projeto em análise de revisão',       2),
    ('a1000001-0000-0000-0000-000000000003', 'APROVADO',     'Projeto aprovado para execução',      3),
    ('a1000001-0000-0000-0000-000000000004', 'EM_ANDAMENTO', 'Projeto em execução',                 4),
    ('a1000001-0000-0000-0000-000000000005', 'EM_TESTE',     'Projeto em fase de testes',           5),
    ('a1000001-0000-0000-0000-000000000006', 'CONCLUIDO',    'Projeto finalizado com sucesso',      6),
    ('a1000001-0000-0000-0000-000000000007', 'REPROVADO',    'Projeto não aprovado',                7),
    ('a1000001-0000-0000-0000-000000000098', 'ARQUIVADO',    'Projeto arquivado',                   98),
    ('a1000001-0000-0000-0000-000000000099', 'CANCELADO',    'Projeto cancelado',                   99)
ON CONFLICT (id) DO NOTHING;

-- ─── STATUS REQUISITO ────────────────────────────────────────────────────────

INSERT INTO status_requisito (id, nome, descricao, ordem) VALUES
    ('b2000002-0000-0000-0000-000000000001', 'RASCUNHO',   'Requisito em elaboração inicial',  1),
    ('b2000002-0000-0000-0000-000000000002', 'EM_REVISAO', 'Requisito em análise de revisão',  2),
    ('b2000002-0000-0000-0000-000000000003', 'APROVADO',   'Requisito aprovado',               3),
    ('b2000002-0000-0000-0000-000000000004', 'REPROVADO',  'Requisito não aprovado',           4),
    ('b2000002-0000-0000-0000-000000000099', 'ARQUIVADO',  'Requisito arquivado',              99)
ON CONFLICT (id) DO NOTHING;

-- ─── PRIORIDADE ──────────────────────────────────────────────────────────────

INSERT INTO prioridade (id, codigo, nome, descricao, ordem, ativo) VALUES
    ('c3000003-0000-0000-0000-000000000001', 'BAIXA',   'Baixa',   'Requisito de baixo impacto no negócio. Pode ser implementado em fases futuras sem comprometer o funcionamento do sistema.', 1, true),
    ('c3000003-0000-0000-0000-000000000002', 'MEDIA',   'Média',   'Requisito com impacto moderado. Importante para a evolução do sistema, mas não bloqueia entregas principais.', 2, true),
    ('c3000003-0000-0000-0000-000000000003', 'ALTA',    'Alta',    'Requisito com alto impacto no negócio ou na experiência do usuário. Deve ser priorizado no planejamento de desenvolvimento.', 3, true),
    ('c3000003-0000-0000-0000-000000000004', 'CRITICA', 'Crítica', 'Requisito essencial para o funcionamento do sistema ou atendimento de regras de negócio. Sua ausência pode comprometer o projeto.', 4, true)
ON CONFLICT (id) DO NOTHING;