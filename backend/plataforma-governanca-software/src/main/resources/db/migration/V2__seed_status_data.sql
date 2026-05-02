-- =============================================================================
-- V2 - Seed dos dados de referência: status_projeto e status_requisito
--
-- Contexto: Estes registros são dados de referência do domínio — fazem parte
-- das regras de negócio da plataforma e não devem ser criados via API.
-- São inseridos uma única vez na inicialização e nunca removidos.
--
-- Estratégia de idempotência: ON CONFLICT DO NOTHING garante que reexecuções
-- acidentais (ex: rebuild de container) não causem erros nem duplicatas.
--
-- IDs fixos via gen_random_uuid() + literal UUID: permitem que outras
-- migrations futuras referenciem estes registros com segurança.
-- =============================================================================

INSERT INTO status_projeto (id, nome, descricao, ordem)
VALUES
    ('a1000001-0000-0000-0000-000000000001', 'RASCUNHO',      'Projeto em elaboração inicial',       1),
    ('a1000001-0000-0000-0000-000000000002', 'EM_REVISAO',    'Projeto em análise de revisão',       2),
    ('a1000001-0000-0000-0000-000000000003', 'APROVADO',      'Projeto aprovado para execução',      3),
    ('a1000001-0000-0000-0000-000000000004', 'EM_ANDAMENTO',  'Projeto em execução',                 4),
    ('a1000001-0000-0000-0000-000000000005', 'EM_TESTE',      'Projeto em fase de testes',           5),
    ('a1000001-0000-0000-0000-000000000006', 'CONCLUIDO',     'Projeto finalizado com sucesso',      6),
    ('a1000001-0000-0000-0000-000000000007', 'REPROVADO',     'Projeto não aprovado',                7),
    ('a1000001-0000-0000-0000-000000000098', 'ARQUIVADO',     'Projeto arquivado',                   98),
    ('a1000001-0000-0000-0000-000000000099', 'CANCELADO',     'Projeto cancelado',                   99)
    ON CONFLICT (nome) DO NOTHING;

INSERT INTO status_requisito (id, nome, descricao, ordem)
VALUES
    ('b2000002-0000-0000-0000-000000000001', 'RASCUNHO',   'Requisito em elaboração inicial',  1),
    ('b2000002-0000-0000-0000-000000000002', 'EM_REVISAO', 'Requisito em análise de revisão',  2),
    ('b2000002-0000-0000-0000-000000000003', 'APROVADO',   'Requisito aprovado',               3),
    ('b2000002-0000-0000-0000-000000000004', 'REPROVADO',  'Requisito não aprovado',           4),
    ('b2000002-0000-0000-0000-000000000099', 'ARQUIVADO',  'Requisito arquivado',              99)
    ON CONFLICT (nome) DO NOTHING;

INSERT INTO prioridade (id, codigo, nome, descricao, ordem)
VALUES
    ('c3000003-0000-0000-0000-000000000001', 'BAIXA', 'Baixa', 'Requisito de baixo impacto no negócio. Pode ser implementado em fases futuras sem comprometer o funcionamento do sistema.', 1),
    ('c3000003-0000-0000-0000-000000000002', 'MEDIA', 'Média', 'Requisito com impacto moderado. Importante para a evolução do sistema, mas não bloqueia entregas principais.', 2),
    ('c3000003-0000-0000-0000-000000000003', 'ALTA', 'Alta', 'Requisito com alto impacto no negócio ou na experiência do usuário. Deve ser priorizado no planejamento de desenvolvimento.', 3),
    ('c3000003-0000-0000-0000-000000000004', 'CRITICA', 'Crítica', 'Requisito essencial para o funcionamento do sistema ou atendimento de regras de negócio. Sua ausência pode comprometer o projeto.', 4)
    ON CONFLICT (nome) DO NOTHING;