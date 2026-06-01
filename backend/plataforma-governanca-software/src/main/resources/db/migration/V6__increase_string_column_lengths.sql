-- V6 — Aumento do tamanho dos campos de texto para 1000 caracteres
-- Campos afetados: projeto.descricao, visao_produto (múltiplos), requisito.descricao,
--                  criterio_aceite.descricao

-- ─── PROJETO ────────────────────────────────────────────────────────────────
ALTER TABLE projeto
    ALTER COLUMN descricao TYPE VARCHAR(1000);

-- ─── VISAO_PRODUTO ──────────────────────────────────────────────────────────
ALTER TABLE visao_produto
    ALTER COLUMN descricao_problema     TYPE VARCHAR(1000),
    ALTER COLUMN publico_alvo           TYPE VARCHAR(1000),
    ALTER COLUMN objetivo_geral         TYPE VARCHAR(1000),
    ALTER COLUMN objetivos_especificos  TYPE VARCHAR(1000),
    ALTER COLUMN kpis                   TYPE VARCHAR(1000),
    ALTER COLUMN restricoes_prazo       TYPE VARCHAR(1000),
    ALTER COLUMN restricoes_orcamento   TYPE VARCHAR(1000),
    ALTER COLUMN tecnologias_obrigatorias TYPE VARCHAR(1000),
    ALTER COLUMN regulamentacoes        TYPE VARCHAR(1000);

-- ─── REQUISITO ──────────────────────────────────────────────────────────────
ALTER TABLE requisito
    ALTER COLUMN descricao TYPE VARCHAR(1000);

-- ─── CRITERIO_ACEITE ────────────────────────────────────────────────────────
-- descricao era TEXT (ilimitado), passa a ser VARCHAR(1000) para consistência
ALTER TABLE criterio_aceite
    ALTER COLUMN descricao TYPE VARCHAR(1000);

-- ─── AUDITORIA ──────────────────────────────────────────────────────────────
-- valor_anterior e valor_novo já são TEXT (ilimitado), permanecem TEXT
-- pois precisam armazenar qualquer valor dos campos acima sem truncamento
-- Nenhuma alteração necessária nesta tabela.
