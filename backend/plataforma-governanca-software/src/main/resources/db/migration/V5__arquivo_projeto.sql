-- V5 — Tabela de arquivos vinculados a projetos
-- Armazena metadados dos arquivos. Os arquivos físicos ficam no file system local.

CREATE TABLE IF NOT EXISTS arquivo_projeto (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id              UUID NOT NULL,
    organization_id         UUID NOT NULL,
    nome_original           VARCHAR(500) NOT NULL,
    nome_arquivo            VARCHAR(500) NOT NULL,
    caminho_arquivo         TEXT NOT NULL,
    extensao                VARCHAR(20) NOT NULL,
    mime_type               VARCHAR(100),
    tamanho_bytes           BIGINT NOT NULL,
    criado_por_usuario_id   UUID,
    data_upload             TIMESTAMP NOT NULL,
    ativo                   BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_arquivo_projeto
        FOREIGN KEY (projeto_id) REFERENCES projeto(id),

    CONSTRAINT fk_arquivo_organizacao
        FOREIGN KEY (organization_id) REFERENCES organizacao(id),

    CONSTRAINT fk_arquivo_usuario
        FOREIGN KEY (criado_por_usuario_id) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_arquivo_projeto_projeto_id
    ON arquivo_projeto (projeto_id, ativo);
