-- V4 — Adiciona coluna `acao` na tabela auditoria
-- Representa a operação realizada: CRIACAO, EDICAO ou EXCLUSAO
--
-- NOT NULL com DEFAULT 'EDICAO' para não quebrar registros históricos
-- já existentes (ação mais comum no histórico antes desta migration).

ALTER TABLE auditoria
    ADD COLUMN IF NOT EXISTS acao VARCHAR(20) NOT NULL DEFAULT 'EDICAO';
