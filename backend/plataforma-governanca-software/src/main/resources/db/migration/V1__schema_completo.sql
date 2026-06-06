-- =============================================================================
-- V1 — Schema completo da aplicação
--
-- Cria todas as tabelas mapeadas pelas entidades JPA.
-- O Flyway executa este script antes de qualquer operação do Hibernate,
-- garantindo que o schema exista quando ddl-auto=validate for usado.
--
-- Ordem de criação respeita as dependências de FK.
-- =============================================================================

-- EXTENSÃO PARA UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- LOOKUP TABLES (sem dependências)
-- =============================================================================

CREATE TABLE status_projeto (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome      VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    ordem     INTEGER     NOT NULL UNIQUE CHECK (ordem > 0)
);

CREATE TABLE status_requisito (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome      VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    ordem     INTEGER     NOT NULL UNIQUE CHECK (ordem > 0)
);

CREATE TABLE prioridade (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo    VARCHAR(50) NOT NULL UNIQUE,
    nome      VARCHAR(50) NOT NULL,
    descricao TEXT,
    ordem     INTEGER UNIQUE,
    ativo     BOOLEAN     NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- MODULO (sem dependências)
-- =============================================================================

CREATE TABLE modulo (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo    VARCHAR(50) UNIQUE,
    nome      VARCHAR(100),
    descricao TEXT,
    ativo     BOOLEAN
);

-- =============================================================================
-- PERMISSAO (depende de modulo)
-- =============================================================================

CREATE TABLE permissao (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo    VARCHAR(100) NOT NULL UNIQUE,
    nome      VARCHAR(150),
    descricao TEXT,
    modulo_id UUID REFERENCES modulo(id)
);

-- =============================================================================
-- PAPEL_ORGANIZACIONAL (sem dependências)
-- =============================================================================

CREATE TABLE papel_organizacional (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo           VARCHAR(50) NOT NULL UNIQUE,
    nome             VARCHAR(100),
    descricao        TEXT,
    nivel_hierarquia INTEGER,
    ativo            BOOLEAN
);

-- =============================================================================
-- PAPEL_PROJETO (sem dependências)
-- =============================================================================

CREATE TABLE papel_projeto (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo           VARCHAR(50) NOT NULL UNIQUE,
    nome             VARCHAR(100),
    descricao        TEXT,
    nivel_hierarquia INTEGER,
    ativo            BOOLEAN
);

-- =============================================================================
-- PAPEL_ORGANIZACIONAL_PERMISSAO
-- =============================================================================

CREATE TABLE papel_organizacional_permissao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    papel_organizacional_id UUID NOT NULL REFERENCES papel_organizacional(id),
    permissao_id            UUID NOT NULL REFERENCES permissao(id),
    CONSTRAINT uk_papel_perm UNIQUE (papel_organizacional_id, permissao_id)
);

-- =============================================================================
-- PAPEL_PROJETO_PERMISSAO
-- =============================================================================

CREATE TABLE papel_projeto_permissao (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    papel_projeto_id UUID NOT NULL REFERENCES papel_projeto(id),
    permissao_id     UUID NOT NULL REFERENCES permissao(id),
    CONSTRAINT uk_papel_projeto_perm UNIQUE (papel_projeto_id, permissao_id)
);

-- =============================================================================
-- USUARIO
-- =============================================================================

CREATE TABLE usuario (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_identity_id UUID,
    nome                 VARCHAR(150) NOT NULL,
    email                VARCHAR(150) NOT NULL UNIQUE,
    ativo                BOOLEAN     NOT NULL,
    data_criacao         TIMESTAMP,
    data_atualizacao     TIMESTAMP,
    url_midia_perfil     TEXT
);

-- =============================================================================
-- ORGANIZACAO
-- =============================================================================

CREATE TABLE organizacao (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(150) NOT NULL,
    descricao        TEXT,
    plano            VARCHAR(50),
    ativo            BOOLEAN     NOT NULL,
    criado_por       UUID        REFERENCES usuario(id),
    data_criacao     TIMESTAMP,
    data_atualizacao TIMESTAMP
);

-- =============================================================================
-- USUARIO_ORGANIZACAO
-- =============================================================================

CREATE TABLE usuario_organizacao (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id              UUID    REFERENCES usuario(id),
    organizacao_id          UUID    REFERENCES organizacao(id),
    papel_organizacional_id UUID    REFERENCES papel_organizacional(id),
    ativo                   BOOLEAN,
    data_entrada            TIMESTAMP,
    data_atualizacao        TIMESTAMP,
    CONSTRAINT uk_usuario_organizacao UNIQUE (usuario_id, organizacao_id)
);

-- =============================================================================
-- PROJETO
-- =============================================================================

CREATE TABLE projeto (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id   UUID        NOT NULL REFERENCES organizacao(id),
    nome             VARCHAR(150) NOT NULL,
    descricao        VARCHAR(1000),
    status_id        UUID        REFERENCES status_projeto(id),
    ativo            BOOLEAN     NOT NULL,
    criado_por       UUID        REFERENCES usuario(id),
    data_criacao     TIMESTAMP,
    data_atualizacao TIMESTAMP
);

-- =============================================================================
-- USUARIO_PROJETO
-- =============================================================================

CREATE TABLE usuario_projeto (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID    REFERENCES usuario(id),
    projeto_id       UUID    REFERENCES projeto(id),
    papel_projeto_id UUID    REFERENCES papel_projeto(id),
    ativo            BOOLEAN,
    data_entrada     TIMESTAMP,
    data_atualizacao TIMESTAMP,
    CONSTRAINT uk_usuario_projeto UNIQUE (usuario_id, projeto_id)
);

-- =============================================================================
-- VISAO_PRODUTO
-- =============================================================================

CREATE TABLE visao_produto (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id               UUID NOT NULL REFERENCES projeto(id),
    descricao_problema       VARCHAR(1000),
    publico_alvo             VARCHAR(1000),
    objetivo_geral           VARCHAR(1000),
    objetivos_especificos    VARCHAR(1000),
    kpis                     VARCHAR(1000),
    restricoes_prazo         VARCHAR(1000),
    restricoes_orcamento     VARCHAR(1000),
    tecnologias_obrigatorias VARCHAR(1000),
    regulamentacoes          VARCHAR(1000),
    data_criacao             TIMESTAMP,
    data_atualizacao         TIMESTAMP
);

-- =============================================================================
-- REQUISITO
-- =============================================================================

CREATE TABLE requisito (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id       UUID        NOT NULL REFERENCES projeto(id),
    codigo           VARCHAR(20) NOT NULL UNIQUE,
    titulo           VARCHAR(255) NOT NULL,
    descricao        VARCHAR(1000),
    tipo_requisito   VARCHAR(50),
    status_id        UUID        REFERENCES status_requisito(id),
    versao           INTEGER,
    prioridade_id    UUID        REFERENCES prioridade(id),
    criado_por       UUID        REFERENCES usuario(id),
    aprovado_por     UUID        REFERENCES usuario(id),
    solicitado_por   UUID        REFERENCES usuario(id),
    ativo            BOOLEAN,
    data_criacao     TIMESTAMP,
    data_solicitacao TIMESTAMP,
    data_aprovacao   TIMESTAMP,
    data_atualizacao TIMESTAMP
);

-- =============================================================================
-- CRITERIO_ACEITE
-- =============================================================================

CREATE TABLE criterio_aceite (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(255) NOT NULL,
    descricao        VARCHAR(1000) NOT NULL,
    criado_por       UUID         REFERENCES usuario(id),
    data_criacao     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    requisito_id     UUID         NOT NULL REFERENCES requisito(id) ON DELETE CASCADE
);

CREATE INDEX idx_criterio_aceite_requisito_id ON criterio_aceite (requisito_id);

-- =============================================================================
-- COMENTARIO
-- =============================================================================

CREATE TABLE comentario (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID        REFERENCES usuario(id),
    organizacao_id   UUID        REFERENCES organizacao(id),
    projeto_id       UUID        REFERENCES projeto(id),
    entidade_tipo    VARCHAR(50),
    entidade_id      UUID,
    conteudo         TEXT,
    ativo            BOOLEAN,
    editado          BOOLEAN     NOT NULL DEFAULT FALSE,
    data_criacao     TIMESTAMP,
    data_atualizacao TIMESTAMP
);

-- =============================================================================
-- AUDITORIA
-- =============================================================================

CREATE TABLE auditoria (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID        REFERENCES organizacao(id),
    projeto_id     UUID        REFERENCES projeto(id),
    entidade_tipo  VARCHAR(50),
    entidade_id    UUID,
    acao           VARCHAR(20) NOT NULL DEFAULT 'EDICAO',
    campo_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo     TEXT,
    usuario_id     UUID        REFERENCES usuario(id),
    data_alteracao TIMESTAMP
);

CREATE INDEX idx_auditoria_entidade ON auditoria (entidade_tipo, entidade_id);
CREATE INDEX idx_auditoria_projeto  ON auditoria (projeto_id, data_alteracao DESC);

-- =============================================================================
-- EVENTOS
-- =============================================================================

CREATE TABLE eventos (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(150),
    descricao        TEXT,
    criado_por       UUID        REFERENCES usuario(id),
    organizacao_id   UUID        REFERENCES organizacao(id),
    projeto_id       UUID        REFERENCES projeto(id),
    data_hora_inicio TIMESTAMP,
    data_hora_fim    TIMESTAMP,
    data_criacao     TIMESTAMP
);

-- =============================================================================
-- ARQUIVO_PROJETO
-- =============================================================================

CREATE TABLE arquivo_projeto (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id            UUID         NOT NULL REFERENCES projeto(id),
    organization_id       UUID         NOT NULL REFERENCES organizacao(id),
    nome_original         VARCHAR(500) NOT NULL,
    nome_arquivo          VARCHAR(500) NOT NULL,
    caminho_arquivo       TEXT         NOT NULL,
    extensao              VARCHAR(20)  NOT NULL,
    mime_type             VARCHAR(100),
    tamanho_bytes         BIGINT       NOT NULL,
    criado_por_usuario_id UUID         REFERENCES usuario(id),
    data_upload           TIMESTAMP    NOT NULL,
    ativo                 BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_arquivo_projeto_projeto_id ON arquivo_projeto (projeto_id, ativo);

-- =============================================================================
-- INTERACAO
-- =============================================================================

CREATE TABLE interacao (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID        NOT NULL REFERENCES usuario(id),
    projeto_id      UUID        NOT NULL REFERENCES projeto(id),
    modulo          VARCHAR(20) NOT NULL,
    tipo            VARCHAR(20) NOT NULL,
    entidade_id     UUID,
    descricao       TEXT,
    data_interacao  TIMESTAMP   NOT NULL
);

CREATE INDEX idx_interacao_projeto         ON interacao (projeto_id);
CREATE INDEX idx_interacao_usuario_projeto ON interacao (usuario_id, projeto_id);
