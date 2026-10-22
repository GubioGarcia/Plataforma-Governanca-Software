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
-- ─── INTERAÇÕES: correção do histórico (analytics) ──────────────────────────
-- Até out/2026 algumas ações não registravam interação (comentários, edição e
-- remoção de vínculos, relacionamentos e impactos em dados) e outras eram
-- registradas com o tipo errado (aprovação/reprovação e mudança de status como
-- EDICAO). Os comandos abaixo completam o histórico a partir dos comentários e da
-- auditoria. Idempotentes: só inserem o que ainda não existe e só reclassificam
-- registros com o tipo antigo.

-- Comentários: criação (data do comentário)
INSERT INTO interacao (id, usuario_id, projeto_id, modulo, tipo, entidade_id, descricao, data_interacao)
SELECT gen_random_uuid(), c.usuario_id, c.projeto_id, 'COMENTARIO', 'COMENTARIO', c.id,
       'Comentou em ' || lower(coalesce(c.entidade_tipo, 'item')), coalesce(c.data_criacao, now())
FROM comentario c
WHERE c.usuario_id IS NOT NULL AND c.projeto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM interacao i
                  WHERE i.modulo = 'COMENTARIO' AND i.tipo = 'COMENTARIO' AND i.entidade_id = c.id);

-- Comentários editados (a data da última edição só é conhecida se não foi excluído depois)
INSERT INTO interacao (id, usuario_id, projeto_id, modulo, tipo, entidade_id, descricao, data_interacao)
SELECT gen_random_uuid(), c.usuario_id, c.projeto_id, 'COMENTARIO', 'EDICAO', c.id,
       'Editou um comentário em ' || lower(coalesce(c.entidade_tipo, 'item')),
       CASE WHEN c.ativo THEN coalesce(c.data_atualizacao, c.data_criacao, now()) ELSE coalesce(c.data_criacao, now()) END
FROM comentario c
WHERE c.editado AND c.usuario_id IS NOT NULL AND c.projeto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM interacao i
                  WHERE i.modulo = 'COMENTARIO' AND i.tipo = 'EDICAO' AND i.entidade_id = c.id);

-- Comentários excluídos (exclusão lógica: data_atualizacao é o momento da exclusão)
INSERT INTO interacao (id, usuario_id, projeto_id, modulo, tipo, entidade_id, descricao, data_interacao)
SELECT gen_random_uuid(), c.usuario_id, c.projeto_id, 'COMENTARIO', 'EXCLUSAO', c.id,
       'Excluiu um comentário em ' || lower(coalesce(c.entidade_tipo, 'item')),
       coalesce(c.data_atualizacao, c.data_criacao, now())
FROM comentario c
WHERE c.ativo = FALSE AND c.usuario_id IS NOT NULL AND c.projeto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM interacao i
                  WHERE i.modulo = 'COMENTARIO' AND i.tipo = 'EXCLUSAO' AND i.entidade_id = c.id);

-- Aprovação/reprovação de requisito gravadas como EDICAO
UPDATE interacao SET tipo = 'APROVACAO'
WHERE modulo = 'REQUISITO' AND tipo = 'EDICAO' AND descricao LIKE 'Requisito aprovado: %';

UPDATE interacao SET tipo = 'REPROVACAO'
WHERE modulo = 'REQUISITO' AND tipo = 'EDICAO' AND descricao LIKE 'Requisito reprovado: %';

-- Edição de requisito que mudou o status (a auditoria do status é gravada na mesma transação)
UPDATE interacao i SET tipo = 'MUDANCA_STATUS'
WHERE i.modulo = 'REQUISITO' AND i.tipo = 'EDICAO' AND i.descricao LIKE 'Requisito atualizado: %'
  AND EXISTS (SELECT 1 FROM auditoria a
              WHERE a.entidade_tipo = 'REQUISITO' AND a.entidade_id = i.entidade_id
                AND a.campo_alterado = 'status' AND a.usuario_id = i.usuario_id
                AND a.data_alteracao BETWEEN i.data_interacao - INTERVAL '5 seconds'
                                         AND i.data_interacao + INTERVAL '1 second');

-- Edição/remoção de vínculos, relacionamentos e impactos em dados (a partir da auditoria,
-- uma edição pode ter gerado várias linhas de auditoria no mesmo segundo)
INSERT INTO interacao (id, usuario_id, projeto_id, modulo, tipo, entidade_id, descricao, data_interacao)
SELECT gen_random_uuid(), a.usuario_id, a.projeto_id,
       CASE WHEN a.entidade_tipo = 'VINCULO_REQUISITO' THEN 'RASTREABILIDADE' ELSE 'MODELAGEM_DADOS' END,
       a.acao, a.entidade_id,
       CASE a.entidade_tipo
           WHEN 'VINCULO_REQUISITO'       THEN CASE a.acao WHEN 'EDICAO' THEN 'Vínculo alterado' ELSE 'Vínculo removido' END
           WHEN 'RELACIONAMENTO_ENTIDADE' THEN CASE a.acao WHEN 'EDICAO' THEN 'Relacionamento alterado' ELSE 'Relacionamento removido' END
           ELSE CASE a.acao WHEN 'EDICAO' THEN 'Impacto em dados alterado' ELSE 'Impacto em dados removido' END
       END,
       min(a.data_alteracao)
FROM auditoria a
WHERE a.entidade_tipo IN ('VINCULO_REQUISITO', 'RELACIONAMENTO_ENTIDADE', 'IMPACTO_DADOS')
  AND a.acao IN ('EDICAO', 'EXCLUSAO')
  AND a.usuario_id IS NOT NULL AND a.projeto_id IS NOT NULL AND a.data_alteracao IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM interacao i
                  WHERE i.entidade_id = a.entidade_id AND i.tipo = a.acao
                    AND i.modulo IN ('RASTREABILIDADE', 'MODELAGEM_DADOS')
                    AND i.data_interacao BETWEEN a.data_alteracao - INTERVAL '1 second'
                                             AND a.data_alteracao + INTERVAL '5 seconds')
GROUP BY a.usuario_id, a.projeto_id, a.entidade_tipo, a.acao, a.entidade_id, date_trunc('second', a.data_alteracao);
