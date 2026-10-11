-- =============================================================================
-- V1 — Schema completo da aplicação
--
-- Cria todas as tabelas mapeadas pelas entidades JPA (exceto as de
-- rastreabilidade/modelagem de dados, que estão no V3).
--
-- NOTA: o Flyway está DESABILITADO nesta aplicação (spring.flyway.enabled=false);
-- o schema real é gerado pelo Hibernate (ddl-auto=update) a partir das entities
-- JPA e os dados de referência vêm do data.sql. Este arquivo é mantido como
-- documentação/referência do modelo (MER_V3), espelhando as entities.
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

-- Papéis e permissões NÃO ficam no banco: o pertencimento (quem é Dono/Gestor/
-- Membro/Stakeholder de qual organização/projeto) é mantido em grupos do Keycloak
-- e a matriz papel → permissão é estática no backend. As tabelas modulo,
-- permissao, papel_organizacional, papel_projeto, papel_*_permissao,
-- usuario_organizacao e usuario_projeto foram removidas
-- (ver autorizacao-organizacao-projeto.md).

-- =============================================================================
-- USUARIO
-- =============================================================================

CREATE TABLE usuario (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_identity_id      UUID        UNIQUE,      -- id do usuário no Keycloak
    nome                      VARCHAR(150) NOT NULL,
    email                     VARCHAR(150) NOT NULL UNIQUE,
    ativo                     BOOLEAN     NOT NULL,
    data_criacao              TIMESTAMP   NOT NULL,
    data_atualizacao          TIMESTAMP,
    url_midia_perfil          TEXT,
    -- Tokens emitidos até este instante são recusados (grupos mudaram ou conta inativada)
    tokens_revogados_antes_de TIMESTAMPTZ
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
    data_atualizacao TIMESTAMP,
    keycloak_group_id UUID       -- grupo /org-{id} no Keycloak
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
    data_atualizacao TIMESTAMP,
    keycloak_group_id UUID       -- grupo /org-{id}/proj-{id} no Keycloak
);

-- =============================================================================
-- VISAO_PRODUTO
-- =============================================================================

CREATE TABLE visao_produto (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id               UUID NOT NULL UNIQUE REFERENCES projeto(id),   -- uma visão por projeto
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
    codigo           VARCHAR(20) NOT NULL,   -- sequencial por projeto (REQ-001...)
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
    data_atualizacao TIMESTAMP,
    CONSTRAINT uk_requisito_projeto_codigo UNIQUE (projeto_id, codigo)
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

CREATE TABLE evento (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(255),
    descricao        TEXT,
    criado_por       UUID        REFERENCES usuario(id),
    organizacao_id   UUID        REFERENCES organizacao(id),   -- a organização do projeto
    projeto_id       UUID        REFERENCES projeto(id),
    data_hora_inicio TIMESTAMP,
    data_hora_fim    TIMESTAMP,
    data_criacao     TIMESTAMP,
    -- SOLICITADO (pedido de stakeholder) | APROVADO | REJEITADO; nulo em dados antigos = APROVADO
    status           VARCHAR(20) CHECK (status IN ('SOLICITADO', 'APROVADO', 'REJEITADO'))
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

-- =============================================================================
-- CONVITE — convite por e-mail para organização (GESTOR/MEMBRO) ou projeto
-- (GESTOR/STAKEHOLDER). Ao aceitar, o backend põe o usuário nos grupos do Keycloak.
-- =============================================================================

CREATE TABLE convite (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL,
    organizacao_id UUID         NOT NULL REFERENCES organizacao(id),
    projeto_id     UUID         REFERENCES projeto(id),         -- nulo = convite para a organização
    papel          VARCHAR(20)  NOT NULL CHECK (papel IN ('GESTOR', 'MEMBRO', 'STAKEHOLDER')),
    status         VARCHAR(20)  NOT NULL CHECK (status IN ('PENDENTE', 'ACEITO', 'RECUSADO', 'CANCELADO', 'EXPIRADO')),
    convidado_por  UUID         REFERENCES usuario(id),
    data_criacao   TIMESTAMPTZ  NOT NULL,
    expira_em      TIMESTAMPTZ  NOT NULL,                      -- validade de 7 dias
    data_resposta  TIMESTAMPTZ
);

-- =============================================================================
-- SOLICITACAO — pedido de stakeholder ao Dono/Gestor do projeto.
-- alvo_id: requisito (tipos *_REQUISITO) ou evento (EVENTO); nulo nas exportações.
-- Sem FK física em alvo_id porque a tabela de destino depende do tipo.
-- =============================================================================

CREATE TABLE solicitacao (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id     UUID          NOT NULL REFERENCES projeto(id),
    tipo           VARCHAR(30)   NOT NULL CHECK (tipo IN ('APROVACAO_REQUISITO', 'ALTERACAO_REQUISITO', 'REPROVACAO_REQUISITO',
                                                         'EVENTO', 'EXPORT_MER', 'EXPORT_RASTREABILIDADE')),
    alvo_id        UUID,
    status         VARCHAR(20)   NOT NULL CHECK (status IN ('PENDENTE', 'ATENDIDA', 'RECUSADA', 'CANCELADA')),
    solicitante_id UUID          NOT NULL REFERENCES usuario(id),
    justificativa  VARCHAR(2000),
    respondido_por UUID          REFERENCES usuario(id),
    resposta       VARCHAR(2000),
    data_criacao   TIMESTAMPTZ   NOT NULL,
    data_resposta  TIMESTAMPTZ
);
