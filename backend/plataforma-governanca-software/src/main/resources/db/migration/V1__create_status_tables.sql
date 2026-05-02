-- =============================================================================
-- V1 - Criação das tabelas de status (lookup tables)
--
-- Contexto: As tabelas status_projeto e status_requisito armazenam os estados
-- possíveis do ciclo de vida de projetos e requisitos respectivamente.
-- São tabelas de lookup controladas pela aplicação — não devem ser alteradas
-- por usuários finais.
--
-- Decisão de design: PK como UUID alinhada ao padrão das demais entidades do
-- domínio. O campo `ordem` garante ordenação determinística na exibição.
-- =============================================================================

-- EXTENSÃO PARA UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TABELAS DE LOOKUP
-- =========================

CREATE TABLE status_projeto (
                                id          UUID PRIMARY KEY,
                                nome        VARCHAR(50) NOT NULL UNIQUE,
                                descricao   VARCHAR(255),
                                ordem       INTEGER NOT NULL UNIQUE CHECK (ordem > 0)
);

CREATE TABLE status_requisito (
                                  id          UUID PRIMARY KEY,
                                  nome        VARCHAR(50) NOT NULL UNIQUE,
                                  descricao   VARCHAR(255),
                                  ordem       INTEGER NOT NULL UNIQUE CHECK (ordem > 0)
);

CREATE TABLE prioridade (
                            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            codigo      VARCHAR(50) NOT NULL UNIQUE,
                            nome        VARCHAR(50) NOT NULL,
                            descricao   TEXT,
                            ordem       INTEGER UNIQUE
);

-- =========================
-- USUARIO
-- =========================

CREATE TABLE usuario (
                         id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         external_identity_id    UUID,
                         nome                    VARCHAR(150) NOT NULL,
                         email                   VARCHAR(150) NOT NULL UNIQUE,
                         ativo                   BOOLEAN NOT NULL,
                         data_criacao            TIMESTAMP,
                         data_atualizacao        TIMESTAMP,
                         url_midia_perfil        TEXT
);

-- =========================
-- ORGANIZACAO
-- =========================

CREATE TABLE organizacao (
                             id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             nome                VARCHAR(150) NOT NULL,
                             descricao           TEXT,
                             plano               VARCHAR(50),
                             ativo               BOOLEAN NOT NULL,
                             criado_por          UUID,
                             data_criacao        TIMESTAMP,
                             data_atualizacao    TIMESTAMP,

                             CONSTRAINT fk_org_usuario
                                 FOREIGN KEY (criado_por) REFERENCES usuario(id)
);

-- =========================
-- PROJETO
-- =========================

CREATE TABLE projeto (
                         id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         organizacao_id      UUID NOT NULL,
                         nome                VARCHAR(150) NOT NULL,
                         descricao           TEXT,
                         status_id           UUID,
                         ativo               BOOLEAN NOT NULL,
                         criado_por          UUID,
                         data_criacao        TIMESTAMP,
                         data_atualizacao    TIMESTAMP,

                         CONSTRAINT fk_projeto_org
                             FOREIGN KEY (organizacao_id) REFERENCES organizacao(id),

                         CONSTRAINT fk_projeto_status
                             FOREIGN KEY (status_id) REFERENCES status_projeto(id),

                         CONSTRAINT fk_projeto_usuario
                             FOREIGN KEY (criado_por) REFERENCES usuario(id)
);

-- =========================
-- VISAO_PRODUTO
-- =========================

CREATE TABLE visao_produto (
                               id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               projeto_id              UUID NOT NULL,
                               descricao_problema      TEXT,
                               publico_alvo            TEXT,
                               objetivo_geral          TEXT,
                               objetivos_especificos   TEXT,
                               kpis                    TEXT,
                               restricoes_prazo        TEXT,
                               restricoes_orcamento    TEXT,
                               tecnologias_obrigatorias TEXT,
                               regulamentacoes         TEXT,
                               data_atualizacao        TIMESTAMP,

                               CONSTRAINT fk_visao_projeto
                                   FOREIGN KEY (projeto_id) REFERENCES projeto(id)
);

-- =========================
-- REQUISITO
-- =========================

CREATE TABLE requisito (
                           id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           projeto_id          UUID NOT NULL,
                           titulo              VARCHAR(255) NOT NULL,
                           descricao           TEXT,
                           tipo_requisito      VARCHAR(50),
                           status_id           UUID,
                           versao              INTEGER,
                           prioridade_id       UUID,
                           criado_por          UUID,
                           aprovado_por        UUID,
                           solicitado_por      UUID,
                           ativo               BOOLEAN,
                           data_criacao        TIMESTAMP,
                           data_solicitacao    TIMESTAMP,
                           data_aprovacao      TIMESTAMP,
                           data_atualizacao    TIMESTAMP,

                           CONSTRAINT fk_req_projeto
                               FOREIGN KEY (projeto_id) REFERENCES projeto(id),

                           CONSTRAINT fk_req_status
                               FOREIGN KEY (status_id) REFERENCES status_requisito(id),

                           CONSTRAINT fk_req_prioridade
                               FOREIGN KEY (prioridade_id) REFERENCES prioridade(id),

                           CONSTRAINT fk_req_criado_por
                               FOREIGN KEY (criado_por) REFERENCES usuario(id),

                           CONSTRAINT fk_req_aprovado_por
                               FOREIGN KEY (aprovado_por) REFERENCES usuario(id),

                           CONSTRAINT fk_req_solicitado_por
                               FOREIGN KEY (solicitado_por) REFERENCES usuario(id)
);

-- =========================
-- COMENTARIO
-- =========================

CREATE TABLE comentario (
                            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            usuario_id      UUID,
                            organizacao_id  UUID,
                            projeto_id      UUID,
                            entidade_tipo   VARCHAR(50),
                            entidade_id     UUID,
                            conteudo        TEXT,
                            ativo           BOOLEAN,
                            data_criacao    TIMESTAMP,

                            CONSTRAINT fk_com_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
                            CONSTRAINT fk_com_org FOREIGN KEY (organizacao_id) REFERENCES organizacao(id),
                            CONSTRAINT fk_com_proj FOREIGN KEY (projeto_id) REFERENCES projeto(id)
);

-- =========================
-- AUDITORIA
-- =========================

CREATE TABLE auditoria (
                           id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           organizacao_id      UUID,
                           projeto_id          UUID,
                           entidade_tipo       VARCHAR(50),
                           entidade_id         UUID,
                           campo_alterado      VARCHAR(100),
                           valor_anterior      TEXT,
                           valor_novo          TEXT,
                           usuario_id          UUID,
                           data_alteracao      TIMESTAMP,

                           CONSTRAINT fk_aud_org FOREIGN KEY (organizacao_id) REFERENCES organizacao(id),
                           CONSTRAINT fk_aud_proj FOREIGN KEY (projeto_id) REFERENCES projeto(id),
                           CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- =========================
-- MODULO
-- =========================

CREATE TABLE modulo (
                        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        codigo      VARCHAR(50) UNIQUE,
                        nome        VARCHAR(100),
                        descricao   TEXT,
                        ativo       BOOLEAN
);

-- =========================
-- EVENTOS
-- =========================

CREATE TABLE eventos (
                         id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         nome                VARCHAR(150),
                         descricao           TEXT,
                         criado_por          UUID,
                         organizacao_id      UUID,
                         projeto_id          UUID,
                         data_hora_inicio    TIMESTAMP,
                         data_hora_fim       TIMESTAMP,
                         data_criacao        TIMESTAMP,

                         CONSTRAINT fk_evt_usuario FOREIGN KEY (criado_por) REFERENCES usuario(id),
                         CONSTRAINT fk_evt_org FOREIGN KEY (organizacao_id) REFERENCES organizacao(id),
                         CONSTRAINT fk_evt_proj FOREIGN KEY (projeto_id) REFERENCES projeto(id)
);