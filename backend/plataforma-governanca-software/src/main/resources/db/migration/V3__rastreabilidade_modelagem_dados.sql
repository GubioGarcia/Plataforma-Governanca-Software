-- =============================================================================
-- V3 — Rastreabilidade de requisitos e modelagem de dados
--
-- Implementa os Pontos 1B (matriz de rastreabilidade direta + indireta) e
-- 2B (cadastro de entidades/atributos com diff antes/depois), conforme
-- MER_V2 / DER_V4.
--
-- Ordem de criação respeita as dependências de FK:
--   entidade_dados -> atributo_entidade / relacionamento_entidade
--   requisito      -> vinculo_requisito
--   requisito + entidade_dados + atributo_entidade -> impacto_dados
-- =============================================================================

-- =============================================================================
-- ENTIDADE_DADOS
-- =============================================================================

CREATE TABLE entidade_dados (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID         NOT NULL REFERENCES projeto(id),
    nome       VARCHAR(150) NOT NULL,
    descricao  TEXT
);

CREATE INDEX idx_entidade_dados_projeto ON entidade_dados (projeto_id);

-- =============================================================================
-- ATRIBUTO_ENTIDADE
-- =============================================================================

CREATE TABLE atributo_entidade (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade_id UUID        NOT NULL REFERENCES entidade_dados(id) ON DELETE CASCADE,
    nome        VARCHAR(100) NOT NULL,
    tipo        VARCHAR(50) NOT NULL,
    obrigatorio BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_atributo_entidade_entidade ON atributo_entidade (entidade_id);

-- =============================================================================
-- RELACIONAMENTO_ENTIDADE (auto-relacionamento N:N em ENTIDADE_DADOS)
-- =============================================================================

CREATE TABLE relacionamento_entidade (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade_origem_id   UUID        NOT NULL REFERENCES entidade_dados(id),
    entidade_destino_id  UUID        NOT NULL REFERENCES entidade_dados(id),
    tipo                 VARCHAR(50) NOT NULL,
    CONSTRAINT uk_relacionamento_entidade UNIQUE (entidade_origem_id, entidade_destino_id, tipo),
    CONSTRAINT ck_relacionamento_entidade_nao_reflexivo CHECK (entidade_origem_id <> entidade_destino_id)
);

CREATE INDEX idx_relacionamento_entidade_origem  ON relacionamento_entidade (entidade_origem_id);
CREATE INDEX idx_relacionamento_entidade_destino ON relacionamento_entidade (entidade_destino_id);

-- =============================================================================
-- VINCULO_REQUISITO (auto-relacionamento N:N em REQUISITO)
-- =============================================================================

CREATE TABLE vinculo_requisito (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requisito_origem_id   UUID        NOT NULL REFERENCES requisito(id),
    requisito_destino_id  UUID        NOT NULL REFERENCES requisito(id),
    tipo                  VARCHAR(20) NOT NULL,
    CONSTRAINT uk_vinculo_requisito UNIQUE (requisito_origem_id, requisito_destino_id, tipo),
    CONSTRAINT ck_vinculo_requisito_nao_reflexivo CHECK (requisito_origem_id <> requisito_destino_id)
);

CREATE INDEX idx_vinculo_requisito_origem  ON vinculo_requisito (requisito_origem_id);
CREATE INDEX idx_vinculo_requisito_destino ON vinculo_requisito (requisito_destino_id);

-- =============================================================================
-- IMPACTO_DADOS
-- =============================================================================

CREATE TABLE impacto_dados (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requisito_id   UUID        NOT NULL REFERENCES requisito(id),
    entidade_id    UUID        NOT NULL REFERENCES entidade_dados(id),
    atributo_id    UUID        REFERENCES atributo_entidade(id),
    tipo_operacao  VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_novo     TEXT
);

CREATE INDEX idx_impacto_dados_requisito ON impacto_dados (requisito_id);
CREATE INDEX idx_impacto_dados_entidade  ON impacto_dados (entidade_id);
CREATE INDEX idx_impacto_dados_atributo  ON impacto_dados (atributo_id);
