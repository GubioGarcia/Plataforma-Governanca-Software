-- =============================================================================
-- V4 — Dados de referência de sistema
--
-- Os status semeados no V2 são usados pelo nome nas regras de negócio
-- (ProjetoService, RequisitoService, SolicitacaoService) e no frontend (chips e
-- indicadores). Marcados com sistema = TRUE, não podem ser renomeados nem
-- excluídos; descrição e ordem continuam editáveis.
-- =============================================================================

ALTER TABLE status_projeto   ADD COLUMN sistema BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE status_requisito ADD COLUMN sistema BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE status_projeto SET sistema = TRUE WHERE nome IN
    ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'EM_ANDAMENTO', 'EM_TESTE', 'CONCLUIDO', 'REPROVADO', 'ARQUIVADO', 'CANCELADO');

UPDATE status_requisito SET sistema = TRUE WHERE nome IN
    ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'REPROVADO', 'ARQUIVADO');
