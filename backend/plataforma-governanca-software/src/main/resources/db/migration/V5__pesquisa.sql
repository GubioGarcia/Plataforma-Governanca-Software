-- =============================================================================
-- V5 — Pesquisa do TCC (questionário antes e depois do uso da plataforma)
--
-- As respostas ficam fora de interacao e de auditoria: não inflam os
-- indicadores dos projetos nem aparecem na trilha de auditoria. Fora do banco,
-- o participante só aparece pelo código (P-001, ...), gerado por sequência para
-- não ser derivado do UUID.
--
-- Os scripts da demo (carregar_demo / remover_demo) não tocam nestas tabelas.
-- =============================================================================

-- Linha única: estado da coleta. Nasce fechada.
CREATE TABLE pesquisa_configuracao (
    id                   SMALLINT     PRIMARY KEY CHECK (id = 1),
    coleta_aberta        BOOLEAN      NOT NULL DEFAULT FALSE,
    intervalo_minimo_min INTEGER      NOT NULL DEFAULT 15 CHECK (intervalo_minimo_min BETWEEN 0 AND 1440),
    aberta_em            TIMESTAMPTZ,
    encerrada_em         TIMESTAMPTZ,
    atualizado_por       UUID         REFERENCES usuario(id),
    atualizado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO pesquisa_configuracao (id, coleta_aberta, intervalo_minimo_min, atualizado_em)
VALUES (1, FALSE, 15, NOW());

CREATE SEQUENCE pesquisa_codigo_seq START WITH 1 INCREMENT BY 1;

-- Uma por usuário. RETIRADA fica sem código e sem dados, só para o "antes" não
-- ser oferecido de novo.
CREATE TABLE pesquisa_participacao (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id         UUID         NOT NULL UNIQUE REFERENCES usuario(id),
    situacao           VARCHAR(20)  NOT NULL CHECK (situacao IN ('PARTICIPANDO', 'RETIRADA')),
    codigo             VARCHAR(10)  UNIQUE,
    versao_instrumento VARCHAR(10)  NOT NULL,
    consentimento_em   TIMESTAMPTZ,
    funcao             VARCHAR(40)  CHECK (funcao IN ('GERENTE_PROJETOS', 'PRODUCT_OWNER', 'ANALISTA_REQUISITOS',
                                                      'DESENVOLVEDOR', 'CLIENTE_STAKEHOLDER', 'OUTRA')),
    tempo_experiencia  VARCHAR(20)  CHECK (tempo_experiencia IN ('ATE_5', 'DE_6_A_10', 'DE_11_A_15', 'MAIS_DE_15')),
    ferramenta_outro   VARCHAR(100),
    criado_em          TIMESTAMPTZ  NOT NULL,
    atualizado_em      TIMESTAMPTZ  NOT NULL
);

CREATE TABLE pesquisa_participacao_ferramenta (
    participacao_id UUID        NOT NULL REFERENCES pesquisa_participacao(id) ON DELETE CASCADE,
    ferramenta      VARCHAR(30) NOT NULL CHECK (ferramenta IN ('JIRA', 'CONFLUENCE', 'AZURE_DEVOPS', 'JAMA_CONNECT',
                                                               'IBM_DOORS', 'PRODUCTBOARD', 'PLANILHAS_DOCUMENTOS',
                                                               'EMAIL_MENSAGENS', 'OUTRA')),
    PRIMARY KEY (participacao_id, ferramenta)
);

-- Uma por etapa: o UNIQUE garante resposta única mesmo com envios simultâneos.
CREATE TABLE pesquisa_resposta (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    participacao_id UUID          NOT NULL REFERENCES pesquisa_participacao(id) ON DELETE CASCADE,
    etapa           VARCHAR(10)   NOT NULL CHECK (etapa IN ('ANTES', 'DEPOIS')),
    item1           SMALLINT      NOT NULL CHECK (item1 BETWEEN 1 AND 5),
    item2           SMALLINT      NOT NULL CHECK (item2 BETWEEN 1 AND 5),
    item3           SMALLINT      NOT NULL CHECK (item3 BETWEEN 1 AND 5),
    item4           SMALLINT      NOT NULL CHECK (item4 BETWEEN 1 AND 5),
    item5           SMALLINT      NOT NULL CHECK (item5 BETWEEN 1 AND 5),
    resposta_aberta VARCHAR(2000),
    respondida_em   TIMESTAMPTZ   NOT NULL,
    CONSTRAINT uk_pesquisa_resposta_etapa UNIQUE (participacao_id, etapa)
);
