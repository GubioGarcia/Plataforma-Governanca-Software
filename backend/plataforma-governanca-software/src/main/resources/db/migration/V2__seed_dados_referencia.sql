-- =============================================================================
-- V2 — Seed dos dados de referência
--
-- Popula tabelas de lookup e papéis/permissões necessários para o
-- funcionamento da aplicação desde o primeiro start.
--
-- Idempotente: ON CONFLICT DO NOTHING garante segurança em reexecuções.
-- =============================================================================

-- ─── STATUS PROJETO ──────────────────────────────────────────────────────────

INSERT INTO status_projeto (id, nome, descricao, ordem) VALUES
    ('a1000001-0000-0000-0000-000000000001', 'RASCUNHO',     'Projeto em elaboração inicial',       1),
    ('a1000001-0000-0000-0000-000000000002', 'EM_REVISAO',   'Projeto em análise de revisão',       2),
    ('a1000001-0000-0000-0000-000000000003', 'APROVADO',     'Projeto aprovado para execução',      3),
    ('a1000001-0000-0000-0000-000000000004', 'EM_ANDAMENTO', 'Projeto em execução',                 4),
    ('a1000001-0000-0000-0000-000000000005', 'EM_TESTE',     'Projeto em fase de testes',           5),
    ('a1000001-0000-0000-0000-000000000006', 'CONCLUIDO',    'Projeto finalizado com sucesso',      6),
    ('a1000001-0000-0000-0000-000000000007', 'REPROVADO',    'Projeto não aprovado',                7),
    ('a1000001-0000-0000-0000-000000000098', 'ARQUIVADO',    'Projeto arquivado',                   98),
    ('a1000001-0000-0000-0000-000000000099', 'CANCELADO',    'Projeto cancelado',                   99)
ON CONFLICT (nome) DO NOTHING;

-- ─── STATUS REQUISITO ────────────────────────────────────────────────────────

INSERT INTO status_requisito (id, nome, descricao, ordem) VALUES
    ('b2000002-0000-0000-0000-000000000001', 'RASCUNHO',   'Requisito em elaboração inicial',  1),
    ('b2000002-0000-0000-0000-000000000002', 'EM_REVISAO', 'Requisito em análise de revisão',  2),
    ('b2000002-0000-0000-0000-000000000003', 'APROVADO',   'Requisito aprovado',               3),
    ('b2000002-0000-0000-0000-000000000004', 'REPROVADO',  'Requisito não aprovado',           4),
    ('b2000002-0000-0000-0000-000000000099', 'ARQUIVADO',  'Requisito arquivado',              99)
ON CONFLICT (nome) DO NOTHING;

-- ─── PRIORIDADE ──────────────────────────────────────────────────────────────

INSERT INTO prioridade (id, codigo, nome, descricao, ordem) VALUES
    ('c3000003-0000-0000-0000-000000000001', 'BAIXA',   'Baixa',   'Requisito de baixo impacto no negócio. Pode ser implementado em fases futuras sem comprometer o funcionamento do sistema.', 1),
    ('c3000003-0000-0000-0000-000000000002', 'MEDIA',   'Média',   'Requisito com impacto moderado. Importante para a evolução do sistema, mas não bloqueia entregas principais.', 2),
    ('c3000003-0000-0000-0000-000000000003', 'ALTA',    'Alta',    'Requisito com alto impacto no negócio ou na experiência do usuário. Deve ser priorizado no planejamento de desenvolvimento.', 3),
    ('c3000003-0000-0000-0000-000000000004', 'CRITICA', 'Crítica', 'Requisito essencial para o funcionamento do sistema ou atendimento de regras de negócio. Sua ausência pode comprometer o projeto.', 4)
ON CONFLICT (nome) DO NOTHING;

-- ─── MODULOS ─────────────────────────────────────────────────────────────────

INSERT INTO modulo (id, codigo, nome, descricao, ativo) VALUES
    ('d4000004-0000-0000-0000-000000000001', 'WIKI',      'Wiki / Visão de Produto', 'Módulo de documentação e visão de produto do projeto', TRUE),
    ('d4000004-0000-0000-0000-000000000002', 'REQUISITO', 'Requisitos',              'Módulo de gestão de requisitos', TRUE),
    ('d4000004-0000-0000-0000-000000000003', 'COMENTARIO','Comentários',             'Módulo de colaboração via comentários', TRUE),
    ('d4000004-0000-0000-0000-000000000004', 'EVENTO',    'Eventos',                 'Módulo de agendamento de eventos', TRUE),
    ('d4000004-0000-0000-0000-000000000005', 'ARQUIVO',   'Arquivos',                'Módulo de gestão de arquivos', TRUE),
    ('d4000004-0000-0000-0000-000000000006', 'MODELAGEM_DADOS', 'Modelagem de Dados', 'Módulo de modelagem de entidades de dados vinculadas a requisitos', TRUE),
    ('d4000004-0000-0000-0000-000000000007', 'RASTREABILIDADE', 'Rastreabilidade',    'Módulo de matriz de rastreabilidade e análise de impacto entre requisitos', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ─── PERMISSOES ──────────────────────────────────────────────────────────────

INSERT INTO permissao (id, codigo, nome, descricao, modulo_id) VALUES
    -- Organização
    ('e5000005-0000-0000-0000-000000000001', 'ORG_CRIAR',          'Criar organização',               'Permite criar uma nova organização', NULL),
    ('e5000005-0000-0000-0000-000000000002', 'ORG_EDITAR',         'Editar organização',              'Permite editar dados da organização', NULL),
    ('e5000005-0000-0000-0000-000000000003', 'ORG_VISUALIZAR',     'Visualizar organização',          'Permite visualizar dados da organização', NULL),
    ('e5000005-0000-0000-0000-000000000004', 'ORG_DESATIVAR',      'Desativar organização',           'Permite desativar uma organização', NULL),
    ('e5000005-0000-0000-0000-000000000005', 'ORG_MEMBRO_CONVIDAR','Convidar membros',                'Permite convidar usuários para a organização', NULL),
    ('e5000005-0000-0000-0000-000000000006', 'ORG_MEMBRO_REMOVER', 'Remover membros',                 'Permite remover usuários da organização', NULL),
    -- Projeto
    ('e5000005-0000-0000-0000-000000000010', 'PROJ_CRIAR',         'Criar projeto',                   'Permite criar projetos na organização', NULL),
    ('e5000005-0000-0000-0000-000000000011', 'PROJ_EDITAR',        'Editar projeto',                  'Permite editar dados do projeto', NULL),
    ('e5000005-0000-0000-0000-000000000012', 'PROJ_VISUALIZAR',    'Visualizar projeto',              'Permite visualizar projetos', NULL),
    ('e5000005-0000-0000-0000-000000000013', 'PROJ_DESATIVAR',     'Desativar projeto',               'Permite desativar um projeto', NULL),
    ('e5000005-0000-0000-0000-000000000014', 'PROJ_MEMBRO_ADICIONAR','Adicionar membros ao projeto',  'Permite adicionar membros ao projeto', NULL),
    ('e5000005-0000-0000-0000-000000000015', 'PROJ_MEMBRO_REMOVER','Remover membros do projeto',      'Permite remover membros do projeto', NULL),
    -- Requisitos
    ('e5000005-0000-0000-0000-000000000020', 'REQ_CRIAR',          'Criar requisito',                 'Permite criar requisitos', 'd4000004-0000-0000-0000-000000000002'),
    ('e5000005-0000-0000-0000-000000000021', 'REQ_EDITAR',         'Editar requisito',                'Permite editar requisitos', 'd4000004-0000-0000-0000-000000000002'),
    ('e5000005-0000-0000-0000-000000000022', 'REQ_VISUALIZAR',     'Visualizar requisito',            'Permite visualizar requisitos', 'd4000004-0000-0000-0000-000000000002'),
    ('e5000005-0000-0000-0000-000000000023', 'REQ_APROVAR',        'Aprovar requisito',               'Permite aprovar requisitos', 'd4000004-0000-0000-0000-000000000002'),
    ('e5000005-0000-0000-0000-000000000024', 'REQ_REPROVAR',       'Reprovar requisito',              'Permite reprovar requisitos', 'd4000004-0000-0000-0000-000000000002'),
    -- Wiki
    ('e5000005-0000-0000-0000-000000000030', 'WIKI_EDITAR',        'Editar wiki',                     'Permite editar a visão de produto/wiki', 'd4000004-0000-0000-0000-000000000001'),
    ('e5000005-0000-0000-0000-000000000031', 'WIKI_VISUALIZAR',    'Visualizar wiki',                 'Permite visualizar a visão de produto/wiki', 'd4000004-0000-0000-0000-000000000001'),
    -- Comentários
    ('e5000005-0000-0000-0000-000000000040', 'COM_CRIAR',          'Criar comentário',                'Permite criar comentários', 'd4000004-0000-0000-0000-000000000003'),
    ('e5000005-0000-0000-0000-000000000041', 'COM_EDITAR',         'Editar comentário',               'Permite editar próprios comentários', 'd4000004-0000-0000-0000-000000000003'),
    ('e5000005-0000-0000-0000-000000000042', 'COM_EXCLUIR',        'Excluir comentário',              'Permite excluir comentários', 'd4000004-0000-0000-0000-000000000003'),
    -- Eventos
    ('e5000005-0000-0000-0000-000000000050', 'EVT_CRIAR',          'Criar evento',                    'Permite criar eventos', 'd4000004-0000-0000-0000-000000000004'),
    ('e5000005-0000-0000-0000-000000000051', 'EVT_EDITAR',         'Editar evento',                   'Permite editar eventos', 'd4000004-0000-0000-0000-000000000004'),
    ('e5000005-0000-0000-0000-000000000052', 'EVT_EXCLUIR',        'Excluir evento',                  'Permite excluir eventos', 'd4000004-0000-0000-0000-000000000004'),
    -- Arquivos
    ('e5000005-0000-0000-0000-000000000060', 'ARQ_UPLOAD',         'Upload de arquivo',               'Permite fazer upload de arquivos', 'd4000004-0000-0000-0000-000000000005'),
    ('e5000005-0000-0000-0000-000000000061', 'ARQ_DOWNLOAD',       'Download de arquivo',             'Permite baixar arquivos', 'd4000004-0000-0000-0000-000000000005'),
    ('e5000005-0000-0000-0000-000000000062', 'ARQ_EXCLUIR',        'Excluir arquivo',                 'Permite excluir arquivos', 'd4000004-0000-0000-0000-000000000005')
ON CONFLICT (codigo) DO NOTHING;

-- ─── PAPEIS ORGANIZACIONAIS ──────────────────────────────────────────────────

INSERT INTO papel_organizacional (id, codigo, nome, descricao, nivel_hierarquia, ativo) VALUES
    ('f6000006-0000-0000-0000-000000000001', 'ORG_OWNER',  'Proprietário',  'Acesso total à organização, projetos e membros', 1, TRUE),
    ('f6000006-0000-0000-0000-000000000002', 'ORG_ADMIN',  'Administrador', 'Gerencia projetos e membros da organização',    2, TRUE),
    ('f6000006-0000-0000-0000-000000000003', 'ORG_MEMBRO', 'Membro',        'Acesso básico à organização e seus projetos',    3, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ─── PAPEIS DE PROJETO ───────────────────────────────────────────────────────

INSERT INTO papel_projeto (id, codigo, nome, descricao, nivel_hierarquia, ativo) VALUES
    ('g7000007-0000-0000-0000-000000000001', 'PROJ_LIDER',         'Líder de Projeto',     'Responsável pelo projeto, acesso total', 1, TRUE),
    ('g7000007-0000-0000-0000-000000000002', 'PROJ_ANALISTA',      'Analista',             'Cria e aprova requisitos',               2, TRUE),
    ('g7000007-0000-0000-0000-000000000003', 'PROJ_DESENVOLVEDOR', 'Desenvolvedor',        'Visualiza e comenta requisitos',         3, TRUE),
    ('g7000007-0000-0000-0000-000000000004', 'PROJ_OBSERVADOR',    'Observador',           'Apenas visualização',                    4, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ─── PERMISSÕES DO PAPEL ORGANIZACIONAL: ORG_OWNER (todas) ──────────────────

INSERT INTO papel_organizacional_permissao (papel_organizacional_id, permissao_id)
SELECT 'f6000006-0000-0000-0000-000000000001', id FROM permissao
ON CONFLICT ON CONSTRAINT uk_papel_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL ORGANIZACIONAL: ORG_ADMIN ──────────────────────────

INSERT INTO papel_organizacional_permissao (papel_organizacional_id, permissao_id)
SELECT 'f6000006-0000-0000-0000-000000000002', id FROM permissao
WHERE codigo IN (
    'ORG_EDITAR','ORG_VISUALIZAR','ORG_MEMBRO_CONVIDAR','ORG_MEMBRO_REMOVER',
    'PROJ_CRIAR','PROJ_EDITAR','PROJ_VISUALIZAR','PROJ_DESATIVAR',
    'PROJ_MEMBRO_ADICIONAR','PROJ_MEMBRO_REMOVER',
    'REQ_CRIAR','REQ_EDITAR','REQ_VISUALIZAR','REQ_APROVAR','REQ_REPROVAR',
    'WIKI_EDITAR','WIKI_VISUALIZAR',
    'COM_CRIAR','COM_EDITAR','COM_EXCLUIR',
    'EVT_CRIAR','EVT_EDITAR','EVT_EXCLUIR',
    'ARQ_UPLOAD','ARQ_DOWNLOAD','ARQ_EXCLUIR'
)
ON CONFLICT ON CONSTRAINT uk_papel_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL ORGANIZACIONAL: ORG_MEMBRO ─────────────────────────

INSERT INTO papel_organizacional_permissao (papel_organizacional_id, permissao_id)
SELECT 'f6000006-0000-0000-0000-000000000003', id FROM permissao
WHERE codigo IN (
    'ORG_VISUALIZAR','PROJ_VISUALIZAR',
    'REQ_VISUALIZAR','WIKI_VISUALIZAR',
    'COM_CRIAR','COM_EDITAR',
    'EVT_CRIAR','ARQ_DOWNLOAD'
)
ON CONFLICT ON CONSTRAINT uk_papel_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL DE PROJETO: PROJ_LIDER (todas de projeto) ───────────

INSERT INTO papel_projeto_permissao (papel_projeto_id, permissao_id)
SELECT 'g7000007-0000-0000-0000-000000000001', id FROM permissao
WHERE codigo IN (
    'PROJ_EDITAR','PROJ_VISUALIZAR','PROJ_DESATIVAR',
    'PROJ_MEMBRO_ADICIONAR','PROJ_MEMBRO_REMOVER',
    'REQ_CRIAR','REQ_EDITAR','REQ_VISUALIZAR','REQ_APROVAR','REQ_REPROVAR',
    'WIKI_EDITAR','WIKI_VISUALIZAR',
    'COM_CRIAR','COM_EDITAR','COM_EXCLUIR',
    'EVT_CRIAR','EVT_EDITAR','EVT_EXCLUIR',
    'ARQ_UPLOAD','ARQ_DOWNLOAD','ARQ_EXCLUIR'
)
ON CONFLICT ON CONSTRAINT uk_papel_projeto_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL DE PROJETO: PROJ_ANALISTA ───────────────────────────

INSERT INTO papel_projeto_permissao (papel_projeto_id, permissao_id)
SELECT 'g7000007-0000-0000-0000-000000000002', id FROM permissao
WHERE codigo IN (
    'PROJ_VISUALIZAR',
    'REQ_CRIAR','REQ_EDITAR','REQ_VISUALIZAR','REQ_APROVAR','REQ_REPROVAR',
    'WIKI_EDITAR','WIKI_VISUALIZAR',
    'COM_CRIAR','COM_EDITAR',
    'EVT_CRIAR','EVT_EDITAR',
    'ARQ_UPLOAD','ARQ_DOWNLOAD'
)
ON CONFLICT ON CONSTRAINT uk_papel_projeto_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL DE PROJETO: PROJ_DESENVOLVEDOR ─────────────────────

INSERT INTO papel_projeto_permissao (papel_projeto_id, permissao_id)
SELECT 'g7000007-0000-0000-0000-000000000003', id FROM permissao
WHERE codigo IN (
    'PROJ_VISUALIZAR',
    'REQ_VISUALIZAR',
    'WIKI_VISUALIZAR',
    'COM_CRIAR','COM_EDITAR',
    'ARQ_DOWNLOAD'
)
ON CONFLICT ON CONSTRAINT uk_papel_projeto_perm DO NOTHING;

-- ─── PERMISSÕES DO PAPEL DE PROJETO: PROJ_OBSERVADOR ────────────────────────

INSERT INTO papel_projeto_permissao (papel_projeto_id, permissao_id)
SELECT 'g7000007-0000-0000-0000-000000000004', id FROM permissao
WHERE codigo IN (
    'PROJ_VISUALIZAR','REQ_VISUALIZAR','WIKI_VISUALIZAR','ARQ_DOWNLOAD'
)
ON CONFLICT ON CONSTRAINT uk_papel_projeto_perm DO NOTHING;
