-- V3 — Colunas adicionadas após a criação inicial
-- comentario.editado: indica se o comentário foi editado pelo autor
-- comentario.data_atualizacao: timestamp de última edição
-- requisito.codigo: código único do requisito (ex.: REQ-001)

ALTER TABLE comentario
    ADD COLUMN IF NOT EXISTS editado          BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP;

ALTER TABLE requisito
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

-- Cria índice para buscas por entidade na tabela de auditoria (já existente no V1)
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade
    ON auditoria (entidade_tipo, entidade_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_projeto
    ON auditoria (projeto_id, data_alteracao DESC);
