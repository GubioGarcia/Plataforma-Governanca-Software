-- Migration: Tabela de Critérios de Aceite
-- Execute após a tabela requisito já existir

CREATE TABLE IF NOT EXISTS criterio_aceite (
                                               id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    descricao   TEXT        NOT NULL,
    criado_por  UUID        REFERENCES usuario(id),
    data_criacao     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    requisito_id UUID NOT NULL REFERENCES requisito(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_criterio_aceite_requisito_id
    ON criterio_aceite (requisito_id);