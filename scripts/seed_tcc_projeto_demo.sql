-- =============================================================================
-- seed_tcc_projeto_demo.sql
--
-- Simula, dentro da própria Plataforma de Governança de Software, o cadastro
-- completo do projeto de software do TCC (metadados, visão de produto,
-- requisitos, rastreabilidade entre requisitos e modelagem de dados).
--
-- Fonte dos dados:
--   - "Plano de Pesquisa do TCC" (título, objetivo geral, objetivos específicos,
--     discentes, orientador, tecnologias, restrições)
--   - "Lista de Requisitos Funcionais e Não Funcionais" (RF01..RF15 / RNF01..RNF12)
--   - MER_V2.txt / DER_V4.drawio (estrutura do banco)
--
-- Banco alvo : PostgreSQL (usa gen_random_uuid via pgcrypto — já habilitado no schema)
-- Pré-requisito: schema V1 criado + dados de referência do data.sql carregados
--   (status_projeto, status_requisito e prioridade, com os UUIDs
--    'a1000001-...', 'b2000002-...', 'c3000003-...').
--
-- Escopo: só dados da aplicação. Quem é quem (Dono, Gestor, Stakeholder...) NÃO
--   fica no banco: é pertencimento a grupos do Keycloak. Por isso este script
--   não é rodado sozinho — use scripts/recriar_ambiente_dev.py, que:
--     1) cria as contas no Keycloak e preenche usuario.external_identity_id;
--     2) reinicia o backend, cuja migração de grupos cria /org-{id} e
--        /org-{id}/proj-{id} e põe o criador (Gubio) no _dono;
--     3) põe os demais nos grupos (Luiz/Thiago gestores da org, Plínio
--        stakeholder técnico + cliente do projeto, Gubio em /_admin).
--
-- Códigos: REQ-001..REQ-027, no formato gerado pelo backend (sequencial por
--   projeto). O identificador do documento de requisitos (RF01..RF15,
--   RNF01..RNF12) fica no início do título.
--
-- Idempotente: todo INSERT usa ON CONFLICT (id) DO NOTHING e UUIDs fixos.
-- Para reexecutar do zero, descomente o bloco LIMPEZA e rode antes do restante.
-- =============================================================================

BEGIN;

-- =============================================================================
-- LIMPEZA (opcional) — apaga apenas os dados criados por este script
-- =============================================================================
-- DELETE FROM solicitacao            WHERE id::text LIKE 'd0000000-0000-0000-0000-%';
-- DELETE FROM impacto_dados          WHERE id::text LIKE '80000000-0000-0000-0000-%';
-- DELETE FROM vinculo_requisito      WHERE id::text LIKE '70000000-0000-0000-0000-%';
-- DELETE FROM relacionamento_entidade WHERE id::text LIKE '62000000-0000-0000-0000-%';
-- DELETE FROM atributo_entidade      WHERE id::text LIKE '61000000-0000-0000-0000-%';
-- DELETE FROM entidade_dados         WHERE id::text LIKE '60000000-0000-0000-0000-%';
-- DELETE FROM interacao              WHERE id::text LIKE '90000000-0000-0000-0000-%';
-- DELETE FROM auditoria              WHERE id::text LIKE 'a0000000-0000-0000-0000-%';
-- DELETE FROM evento                 WHERE id::text LIKE 'b0000000-0000-0000-0000-%';
-- DELETE FROM comentario             WHERE id::text LIKE 'c0000000-0000-0000-0000-%';
-- DELETE FROM criterio_aceite        WHERE id::text LIKE '50000000-0000-0000-0000-%';
-- DELETE FROM requisito              WHERE id::text LIKE '4f000000-0000-0000-0000-%'
--                                        OR id::text LIKE '4e000000-0000-0000-0000-%';
-- DELETE FROM visao_produto          WHERE id = '30000000-0000-0000-0000-000000000001';
-- DELETE FROM projeto                WHERE id = '20000000-0000-0000-0000-000000000001';
-- DELETE FROM organizacao            WHERE id = '0f000000-0000-0000-0000-0000000000fa';
-- DELETE FROM usuario                WHERE id::text LIKE '11111111-0000-0000-0000-%';


-- =============================================================================
-- 1. USUÁRIOS — discentes + orientador do TCC
-- =============================================================================

INSERT INTO usuario (id, nome, email, ativo, data_criacao, data_atualizacao) VALUES
    ('11111111-0000-0000-0000-000000000001', 'Gubio Garcia dos Santos',                  'gubiogarcia@gmail.com',            TRUE, '2026-02-20 09:00:00', '2026-02-20 09:00:00'),
    ('11111111-0000-0000-0000-000000000002', 'Luiz Fernando De Pádua Paixão',            'luizfernandopadua@gmail.com',      TRUE, '2026-02-20 09:00:00', '2026-02-20 09:00:00'),
    ('11111111-0000-0000-0000-000000000003', 'Thiago Matheus Onorio Ribeiro Pinheiro',   'thiagomatheus@gmail.com', TRUE, '2026-03-05 09:00:00', '2026-03-05 09:00:00'),
    ('11111111-0000-0000-0000-000000000004', 'Prof. Esp. Plínio Marcos Mendes Carneiro', 'plinio.carneiro@fatesg.senai.br',  TRUE, '2026-02-20 09:00:00', '2026-02-20 09:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 2. ORGANIZAÇÃO — Faculdade SENAI Fatesg
-- =============================================================================

INSERT INTO organizacao (id, nome, descricao, plano, ativo, criado_por, data_criacao, data_atualizacao) VALUES
    ('0f000000-0000-0000-0000-0000000000fa',
     'Fatesg',
     'Faculdade de Tecnologia SENAI Fatesg — Goiânia/GO. Instituição de ensino do curso de Engenharia de Software na qual o Trabalho de Conclusão de Curso foi desenvolvido, em alinhamento ao projeto de software da Fábrica de Software.',
     'ACADEMICO',
     TRUE,
     '11111111-0000-0000-0000-000000000001',
     '2026-02-20 09:00:00', '2026-02-20 09:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 3. PROJETO — o próprio TCC
-- =============================================================================

INSERT INTO projeto (id, organizacao_id, nome, descricao, status_id, ativo, criado_por, data_criacao, data_atualizacao) VALUES
    ('20000000-0000-0000-0000-000000000001',
     '0f000000-0000-0000-0000-0000000000fa',
     'Plataforma para Apoio à Gestão da Fase de Discovery e Elicitação de Requisitos com Foco na Interação Contínua de Stakeholders',
     'Trabalho de Conclusão de Curso de Engenharia de Software (Fatesg). Plataforma que centraliza requisitos, stakeholders, documentos e protótipos das fases de Discovery e Elicitação, dando transparência ao escopo acordado entre equipe de desenvolvimento e stakeholders e permitindo acompanhar a evolução dos requisitos e das decisões tomadas no ciclo inicial do projeto. Backend em Java/Spring Boot (monólito modular), PostgreSQL, autenticação via Keycloak e frontend em React/TypeScript.',
     'a1000001-0000-0000-0000-000000000004',   -- status_projeto EM_ANDAMENTO
     TRUE,
     '11111111-0000-0000-0000-000000000001',
     '2026-02-20 09:00:00', '2026-08-30 18:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 4. VISÃO DO PRODUTO (RF06) — problema, público, objetivos, KPIs, restrições
-- =============================================================================

INSERT INTO visao_produto (
    id, projeto_id,
    descricao_problema, publico_alvo, objetivo_geral, objetivos_especificos, kpis,
    restricoes_prazo, restricoes_orcamento, tecnologias_obrigatorias, regulamentacoes,
    data_criacao, data_atualizacao
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Requisitos e documentações mal elaborados ou pouco discutidos nas fases de Discovery e Elicitação geram retrabalho no desenvolvimento e, em casos críticos, a desistência do cliente. As ferramentas existentes não estimulam nem facilitam a participação ativa e contínua dos stakeholders ao longo desse processo.',
    'Gerentes de projeto, Product Owners, Product Managers, responsáveis técnicos e demais stakeholders envolvidos nas fases iniciais de projetos de software.',
    'Desenvolver uma plataforma para apoiar a fase de Discovery e Elicitação de Requisitos, centralizando e organizando as principais informações do projeto (requisitos, stakeholders, documentos e protótipos), garantindo a transparência do escopo acordado entre a equipe de desenvolvimento e os stakeholders e facilitando o acompanhamento da evolução dos requisitos e das decisões tomadas ao longo do ciclo inicial do projeto, com um ambiente único para centralizar as discussões sobre as necessidades levantadas.',
    '1) Levantar as principais dificuldades de gerentes e stakeholders no Discovery/Elicitação via entrevistas ou questionários; 2) Definir e modelar os requisitos funcionais e não funcionais com foco na colaboração contínua; 3) Projetar arquitetura que permita centralização e rastreabilidade de requisitos, decisões, stakeholders e histórico de alterações; 4) Implementar ambiente colaborativo com registro estruturado de requisitos, comentários por requisito, controle de versões e validação formal; 5) Prover transparência do status dos requisitos (proposto, em análise, aprovado, rejeitado, alterado); 6) Registrar decisões da fase inicial garantindo rastreabilidade entre discussões e requisitos aprovados; 7) Validar a plataforma com usuários-alvo; 8) Avaliar a contribuição para a redução de retrabalho e o aumento da clareza do escopo.',
    'Redução de retrabalho por requisitos mal especificados; percentual de requisitos com aprovação formal registrada de stakeholders; tempo médio entre proposta e aprovação de um requisito; número médio de comentários/discussões por requisito; índice de rastreabilidade (requisitos vinculados a decisões e histórico); clareza do escopo percebida pelos usuários-alvo nos testes de validação.',
    'Desenvolvimento vinculado ao cronograma de TCC 1 e TCC 2 (fevereiro de 2025 a 2026), alinhado ao projeto de software da Fábrica de Software da Fatesg.',
    'Sem orçamento financeiro dedicado; uso exclusivo de recursos próprios dos discentes e da infraestrutura (computadores, softwares e biblioteca) da Faculdade SENAI Fatesg.',
    'Java + Spring Boot (backend, monólito modular); PostgreSQL; Keycloak (autenticação e autorização); React + TypeScript (frontend); Docker (infraestrutura local).',
    'Diretrizes institucionais de TCC da Faculdade SENAI Fatesg; boas práticas de Engenharia de Requisitos (Sommerville; Wiegers & Beatty; Vazquez & Simões); LGPD para dados de usuários e stakeholders.',
    '2026-02-20 09:00:00', '2026-03-06 18:00:00'
)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 5. REQUISITOS — RF01..RF15 (funcionais) e RNF01..RNF12 (não funcionais)
--
--   status_requisito : b2000002-...-001 RASCUNHO  / -002 EM_REVISAO / -003 APROVADO
--   prioridade       : c3000003-...-002 MEDIA     / -003 ALTA
--   tipo_requisito   : FUNCIONAL | NAO_FUNCIONAL
-- =============================================================================

INSERT INTO requisito (
    id, projeto_id, codigo, titulo, descricao, tipo_requisito,
    status_id, versao, prioridade_id,
    criado_por, aprovado_por, solicitado_por, ativo,
    data_criacao, data_solicitacao, data_aprovacao, data_atualizacao
) VALUES
-- ─── FUNCIONAIS ─────────────────────────────────────────────────────────────
('4f000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQ-001','RF01 — Cadastro de Organização',
 'O sistema deve permitir o cadastro de organizações contendo informações básicas como nome, descrição e plano. Cada organização poderá possuir múltiplos usuários vinculados com diferentes papéis organizacionais.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 10:00:00','2026-03-05 10:00:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','REQ-002','RF02 — Cadastro de Usuários',
 'O sistema deve permitir o cadastro e o gerenciamento de usuários contendo nome, e-mail e status de atividade. Os usuários poderão ser vinculados a organizações e projetos.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 10:05:00','2026-03-05 10:05:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','REQ-003','RF03 — Gerenciamento de Papéis Organizacionais',
 'O sistema deve permitir definir papéis organizacionais com níveis hierárquicos e permissões associadas para controle de acesso dentro das organizações.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000001',NULL,'11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 10:10:00','2026-03-05 10:10:00',NULL,'2026-03-08 11:00:00'),

('4f000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','REQ-004','RF04 — Cadastro de Projetos',
 'O sistema deve permitir o cadastro de projetos contendo nome, descrição, organização associada e status do projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 10:15:00','2026-03-05 10:15:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','REQ-005','RF05 — Gerenciamento de Stakeholders no Projeto',
 'O sistema deve permitir associar usuários a projetos definindo papéis específicos dentro do projeto, permitindo a participação de diferentes stakeholders.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 10:20:00','2026-03-05 10:20:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','REQ-006','RF06 — Registro da Visão do Produto',
 'O sistema deve permitir registrar a visão do produto contendo problema a ser resolvido, público-alvo, objetivo geral, objetivos específicos, KPIs e restrições do projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 10:25:00','2026-03-05 10:25:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000001','REQ-007','RF07 — Cadastro de Requisitos',
 'O sistema deve permitir o cadastro de requisitos vinculados a um projeto contendo título, descrição, tipo de requisito, versão e status.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',2,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 10:30:00','2026-03-05 10:30:00','2026-03-06 15:00:00','2026-03-08 16:00:00'),

('4f000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000001','REQ-008','RF08 — Discussão de Requisitos',
 'O sistema deve permitir que usuários adicionem comentários e participem de discussões vinculadas aos requisitos registrados no projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 10:35:00','2026-03-05 10:35:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000001','REQ-009','RF09 — Aprovação de Requisitos',
 'O sistema deve permitir que stakeholders aprovem ou rejeitem requisitos registrados no sistema antes da validação final pelo responsável do projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 10:40:00','2026-03-05 10:40:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000001','REQ-010','RF10 — Controle de Status de Requisitos',
 'O sistema deve permitir alterar o status de um requisito entre estados como: proposto, em análise, em validação, aprovado, rejeitado ou alterado.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',2,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 10:45:00','2026-03-05 10:45:00','2026-03-06 15:00:00','2026-03-08 16:00:00'),

('4f000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','REQ-011','RF11 — Registro de Eventos do Projeto',
 'O sistema deve permitir o registro de eventos relacionados ao projeto, como reuniões, workshops de discovery e entregas de artefatos.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000001',NULL,'11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 10:50:00','2026-03-05 10:50:00',NULL,'2026-03-08 11:00:00'),

('4f000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000001','REQ-012','RF12 — Auditoria de Alterações',
 'O sistema deve registrar automaticamente o histórico de alterações realizadas nas entidades do sistema, incluindo usuário responsável, data e valores alterados.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000003',NULL,'11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 10:55:00','2026-03-05 10:55:00',NULL,'2026-03-08 11:00:00'),

('4f000000-0000-0000-0000-000000000013','20000000-0000-0000-0000-000000000001','REQ-013','RF13 — Controle de Permissões',
 'O sistema deve controlar o acesso às funcionalidades com base em permissões associadas aos papéis organizacionais e papéis de projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 11:00:00','2026-03-05 11:00:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4f000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000001','REQ-014','RF14 — Controle de Versão de Requisitos',
 'O sistema deve permitir o controle de versões dos requisitos cadastrados. Sempre que um requisito for alterado, uma nova versão deve ser registrada, preservando o histórico das versões anteriores e permitindo rastrear a evolução das mudanças ao longo do projeto.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000003',2,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 11:05:00','2026-03-05 11:05:00','2026-03-06 15:00:00','2026-03-08 16:00:00'),

('4f000000-0000-0000-0000-000000000015','20000000-0000-0000-0000-000000000001','REQ-015','RF15 — Visualização do Status dos Requisitos',
 'O sistema deve permitir que os usuários visualizem o status atual dos requisitos do projeto (proposto, em análise, em validação, aprovado ou rejeitado), acompanhando a evolução do processo de elicitação e validação.',
 'FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000002',NULL,'11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 11:10:00','2026-03-05 11:10:00',NULL,'2026-03-08 11:00:00'),

-- ─── NÃO FUNCIONAIS ─────────────────────────────────────────────────────────
('4e000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQ-016','RNF01 — Autenticação Segura',
 'O sistema deve utilizar autenticação baseada em um servidor de identidade (Keycloak) para garantir segurança no acesso dos usuários.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 11:20:00','2026-03-05 11:20:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','REQ-017','RNF02 — Controle de Acesso',
 'O sistema deve garantir que usuários acessem apenas funcionalidades permitidas de acordo com seus papéis e permissões.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 11:25:00','2026-03-05 11:25:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','REQ-018','RNF03 — Desempenho do Sistema',
 'O sistema deve responder às requisições do usuário em até 2 segundos em condições normais de uso.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000002',NULL,'11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 11:30:00','2026-03-05 11:30:00',NULL,'2026-03-08 11:00:00'),

('4e000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','REQ-019','RNF04 — Rastreabilidade',
 'O sistema deve manter rastreabilidade entre requisitos, comentários, decisões e histórico de alterações.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 11:35:00','2026-03-05 11:35:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','REQ-020','RNF05 — Escalabilidade',
 'O sistema deve permitir crescimento do número de usuários, projetos e requisitos sem degradação significativa de desempenho.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000003',NULL,'11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 11:40:00','2026-03-05 11:40:00',NULL,'2026-03-08 11:00:00'),

('4e000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','REQ-021','RNF06 — Usabilidade',
 'O sistema deve possuir interface web intuitiva que permita fácil navegação e interação entre os stakeholders.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 11:45:00','2026-03-05 11:45:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000001','REQ-022','RNF07 — Portabilidade',
 'O sistema deve ser acessível por navegadores modernos como Chrome, Firefox e Edge sem necessidade de instalação adicional.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000002',NULL,'11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 11:50:00','2026-03-05 11:50:00',NULL,'2026-03-08 11:00:00'),

('4e000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000001','REQ-023','RNF08 — Integridade dos Dados',
 'O sistema deve garantir a integridade dos dados armazenados no banco, impedindo inconsistências entre informações relacionadas, especialmente entre projetos, requisitos, usuários e comentários.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 11:55:00','2026-03-05 11:55:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000001','REQ-024','RNF09 — Registro de Logs do Sistema',
 'O sistema deve registrar logs de operações relevantes realizadas pelos usuários (criação, alteração e exclusão de informações), permitindo monitoramento e diagnóstico de problemas.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000002',NULL,'11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 12:00:00','2026-03-05 12:00:00',NULL,'2026-03-08 11:00:00'),

('4e000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000001','REQ-025','RNF10 — Consistência de Transações',
 'O sistema deve garantir que operações críticas (criação, atualização e aprovação de requisitos) sejam executadas de forma transacional no banco, assegurando que as alterações sejam concluídas integralmente ou revertidas em caso de falha.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000003',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',TRUE,
 '2026-03-05 12:05:00','2026-03-05 12:05:00','2026-03-06 15:00:00','2026-03-06 15:00:00'),

('4e000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','REQ-026','RNF11 — Backup de Dados',
 'O sistema deve possuir mecanismo de backup periódico dos dados armazenados no banco, garantindo a recuperação das informações em caso de falhas ou perda de dados.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000001',1,'c3000003-0000-0000-0000-000000000003',
 '11111111-0000-0000-0000-000000000001',NULL,'11111111-0000-0000-0000-000000000001',TRUE,
 '2026-03-05 12:10:00','2026-03-05 12:10:00',NULL,'2026-03-05 12:10:00'),

('4e000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000001','REQ-027','RNF12 — Manutenibilidade do Sistema',
 'O sistema deve ser desenvolvido utilizando boas práticas de arquitetura e organização de código, permitindo manutenção, evolução e correção de erros com baixo impacto nas funcionalidades existentes.',
 'NAO_FUNCIONAL','b2000002-0000-0000-0000-000000000002',1,'c3000003-0000-0000-0000-000000000002',
 '11111111-0000-0000-0000-000000000003',NULL,'11111111-0000-0000-0000-000000000003',TRUE,
 '2026-03-05 12:15:00','2026-03-05 12:15:00',NULL,'2026-03-08 11:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 6. CRITÉRIOS DE ACEITE (amostra)
-- =============================================================================

INSERT INTO criterio_aceite (id, nome, descricao, criado_por, data_criacao, data_atualizacao, requisito_id) VALUES
    ('50000000-0000-0000-0000-000000000001','Nome único de organização','Não é permitido cadastrar duas organizações com o mesmo nome.',
     '11111111-0000-0000-0000-000000000002','2026-03-05 10:00:00','2026-03-05 10:00:00','4f000000-0000-0000-0000-000000000001'),
    ('50000000-0000-0000-0000-000000000002','Campos obrigatórios do requisito','Ao cadastrar um requisito, o sistema exige título, tipo e prioridade.',
     '11111111-0000-0000-0000-000000000001','2026-03-05 10:30:00','2026-03-05 10:30:00','4f000000-0000-0000-0000-000000000007'),
    ('50000000-0000-0000-0000-000000000003','Código e versão automáticos','Ao ser criado, o requisito recebe um código único e a versão inicial 1.',
     '11111111-0000-0000-0000-000000000001','2026-03-05 10:30:00','2026-03-05 10:30:00','4f000000-0000-0000-0000-000000000007'),
    ('50000000-0000-0000-0000-000000000004','Aprovação exige stakeholder','Um requisito só passa a APROVADO após aprovação registrada de ao menos um stakeholder do projeto.',
     '11111111-0000-0000-0000-000000000003','2026-03-05 10:40:00','2026-03-05 10:40:00','4f000000-0000-0000-0000-000000000009'),
    ('50000000-0000-0000-0000-000000000005','Rejeição com justificativa','A rejeição de um requisito exige uma justificativa registrada em comentário vinculado.',
     '11111111-0000-0000-0000-000000000003','2026-03-05 10:40:00','2026-03-05 10:40:00','4f000000-0000-0000-0000-000000000009'),
    ('50000000-0000-0000-0000-000000000006','Histórico de versões preservado','Cada alteração aprovada de um requisito gera uma nova versão, mantendo as anteriores consultáveis.',
     '11111111-0000-0000-0000-000000000003','2026-03-05 11:05:00','2026-03-05 11:05:00','4f000000-0000-0000-0000-000000000014')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 7. VÍNCULOS ENTRE REQUISITOS  (camada DIRETA da matriz de rastreabilidade)
--    tipo: DEPENDE_DE | IMPACTA | DUPLICA | CONFLITA
--    UNIQUE (requisito_origem_id, requisito_destino_id, tipo); não reflexivo
-- =============================================================================

INSERT INTO vinculo_requisito (id, requisito_origem_id, requisito_destino_id, tipo) VALUES
    ('70000000-0000-0000-0000-000000000001','4f000000-0000-0000-0000-000000000004','4f000000-0000-0000-0000-000000000001','DEPENDE_DE'), -- RF04 projeto  depende de RF01 organização
    ('70000000-0000-0000-0000-000000000002','4f000000-0000-0000-0000-000000000002','4f000000-0000-0000-0000-000000000001','DEPENDE_DE'), -- RF02 usuário  depende de RF01
    ('70000000-0000-0000-0000-000000000003','4f000000-0000-0000-0000-000000000003','4f000000-0000-0000-0000-000000000002','DEPENDE_DE'), -- RF03 papéis   depende de RF02
    ('70000000-0000-0000-0000-000000000004','4f000000-0000-0000-0000-000000000005','4f000000-0000-0000-0000-000000000004','DEPENDE_DE'), -- RF05 stakehld depende de RF04
    ('70000000-0000-0000-0000-000000000005','4f000000-0000-0000-0000-000000000005','4f000000-0000-0000-0000-000000000002','DEPENDE_DE'), -- RF05 stakehld depende de RF02
    ('70000000-0000-0000-0000-000000000006','4f000000-0000-0000-0000-000000000006','4f000000-0000-0000-0000-000000000004','DEPENDE_DE'), -- RF06 visão    depende de RF04
    ('70000000-0000-0000-0000-000000000007','4f000000-0000-0000-0000-000000000007','4f000000-0000-0000-0000-000000000004','DEPENDE_DE'), -- RF07 requisito depende de RF04
    ('70000000-0000-0000-0000-000000000008','4f000000-0000-0000-0000-000000000008','4f000000-0000-0000-0000-000000000007','DEPENDE_DE'), -- RF08 discussão depende de RF07
    ('70000000-0000-0000-0000-000000000009','4f000000-0000-0000-0000-000000000009','4f000000-0000-0000-0000-000000000007','DEPENDE_DE'), -- RF09 aprovação depende de RF07
    ('70000000-0000-0000-0000-000000000010','4f000000-0000-0000-0000-000000000009','4f000000-0000-0000-0000-000000000005','DEPENDE_DE'), -- RF09 aprovação depende de RF05 (stakeholders)
    ('70000000-0000-0000-0000-000000000011','4f000000-0000-0000-0000-000000000010','4f000000-0000-0000-0000-000000000007','DEPENDE_DE'), -- RF10 status    depende de RF07
    ('70000000-0000-0000-0000-000000000012','4f000000-0000-0000-0000-000000000011','4f000000-0000-0000-0000-000000000004','DEPENDE_DE'), -- RF11 eventos   depende de RF04
    ('70000000-0000-0000-0000-000000000013','4f000000-0000-0000-0000-000000000012','4f000000-0000-0000-0000-000000000004','DEPENDE_DE'), -- RF12 auditoria depende de RF04
    ('70000000-0000-0000-0000-000000000014','4f000000-0000-0000-0000-000000000013','4f000000-0000-0000-0000-000000000003','DEPENDE_DE'), -- RF13 permissões depende de RF03
    ('70000000-0000-0000-0000-000000000015','4f000000-0000-0000-0000-000000000014','4f000000-0000-0000-0000-000000000007','DEPENDE_DE'), -- RF14 versão    depende de RF07
    ('70000000-0000-0000-0000-000000000016','4f000000-0000-0000-0000-000000000014','4f000000-0000-0000-0000-000000000010','IMPACTA'),    -- RF14 versão    impacta   RF10 status
    ('70000000-0000-0000-0000-000000000017','4f000000-0000-0000-0000-000000000015','4f000000-0000-0000-0000-000000000010','DEPENDE_DE'), -- RF15 visualização depende de RF10
    ('70000000-0000-0000-0000-000000000018','4f000000-0000-0000-0000-000000000012','4f000000-0000-0000-0000-000000000014','IMPACTA'),    -- RF12 auditoria impacta   RF14 versão
    ('70000000-0000-0000-0000-000000000019','4e000000-0000-0000-0000-000000000002','4f000000-0000-0000-0000-000000000013','DEPENDE_DE'), -- RNF02 controle acesso depende de RF13
    ('70000000-0000-0000-0000-000000000020','4e000000-0000-0000-0000-000000000001','4f000000-0000-0000-0000-000000000013','IMPACTA'),    -- RNF01 autenticação impacta RF13
    ('70000000-0000-0000-0000-000000000021','4e000000-0000-0000-0000-000000000004','4f000000-0000-0000-0000-000000000012','DEPENDE_DE'), -- RNF04 rastreabilidade depende de RF12
    ('70000000-0000-0000-0000-000000000022','4e000000-0000-0000-0000-000000000004','4f000000-0000-0000-0000-000000000008','IMPACTA'),    -- RNF04 rastreabilidade impacta RF08 (discussões)
    ('70000000-0000-0000-0000-000000000023','4f000000-0000-0000-0000-000000000012','4e000000-0000-0000-0000-000000000003','CONFLITA'),   -- RF12 auditoria completa CONFLITA RNF03 desempenho (<2s)
    ('70000000-0000-0000-0000-000000000024','4e000000-0000-0000-0000-000000000009','4f000000-0000-0000-0000-000000000012','DUPLICA'),    -- RNF09 logs DUPLICA parcialmente RF12 auditoria
    ('70000000-0000-0000-0000-000000000025','4e000000-0000-0000-0000-000000000010','4f000000-0000-0000-0000-000000000009','IMPACTA')     -- RNF10 transacional impacta RF09 aprovação
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 8. MODELAGEM DE DADOS DO DOMÍNIO EM DISCOVERY
--    (entidades de negócio especificadas no projeto — não são as tabelas
--     físicas desta plataforma; representam o que os requisitos manipulam)
-- =============================================================================

INSERT INTO entidade_dados (id, projeto_id, nome, descricao, criado_por, ativo, data_criacao, data_atualizacao) VALUES
    ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Organizacao',  'Empresa/instituição cliente que agrupa projetos e usuários.',                 '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Usuario',      'Pessoa que acessa a plataforma (gestor, analista, stakeholder, técnico).',     '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Projeto',      'Iniciativa de software em Discovery, pertencente a uma organização.',          '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','VisaoProduto', 'Registro da visão de produto do projeto (problema, objetivos, KPIs, restrições).','11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','Stakeholder',  'Associação de um usuário a um projeto com um papel específico.',               '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','Requisito',    'Necessidade funcional ou não funcional levantada e versionada no projeto.',    '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-08 16:00:00'),
    ('60000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000001','Comentario',   'Mensagem de discussão vinculada a um requisito.',                             '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000001','Evento',       'Reunião, workshop de discovery ou entrega de artefato do projeto.',            '11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00'),
    ('60000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000001','Auditoria',    'Registro imutável de alteração de campo em uma entidade (quem, quando, de/para).','11111111-0000-0000-0000-000000000001',TRUE,'2026-03-06 14:00:00','2026-03-06 14:00:00')
ON CONFLICT (id) DO NOTHING;

-- ─── Atributos das entidades ────────────────────────────────────────────────
--   chave_estrangeira/entidade_referenciada_id materializam a FK estruturada
--   (ver AtributoEntidade.java); o relacionamento_entidade correspondente é
--   inserido logo abaixo, referenciando o atributo pelo id (atributo_fk_id).
INSERT INTO atributo_entidade (id, entidade_id, nome, tipo, obrigatorio, chaveprimaria, ordem, chave_estrangeira, entidade_referenciada_id) VALUES
    -- Organizacao
    ('61000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','id',        'UUID',    TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','nome',      'VARCHAR', TRUE,  FALSE, 2, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001','descricao', 'TEXT',    FALSE, FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000001','plano',     'VARCHAR', FALSE, FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000001','ativo',     'BOOLEAN', TRUE,  FALSE, 5, FALSE, NULL),
    -- Usuario
    ('61000000-0000-0000-0000-000000000010','60000000-0000-0000-0000-000000000002','id',        'UUID',    TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000011','60000000-0000-0000-0000-000000000002','nome',      'VARCHAR', TRUE,  FALSE, 2, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000012','60000000-0000-0000-0000-000000000002','email',     'VARCHAR', TRUE,  FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000013','60000000-0000-0000-0000-000000000002','ativo',     'BOOLEAN', TRUE,  FALSE, 4, FALSE, NULL),
    -- Projeto
    ('61000000-0000-0000-0000-000000000020','60000000-0000-0000-0000-000000000003','id',            'UUID',      TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000003','nome',          'VARCHAR',   TRUE,  FALSE, 2, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000003','descricao',     'TEXT',      FALSE, FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000023','60000000-0000-0000-0000-000000000003','status',        'VARCHAR',   TRUE,  FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000024','60000000-0000-0000-0000-000000000003','organizacao_id','UUID',      TRUE,  FALSE, 5, TRUE,  '60000000-0000-0000-0000-000000000001'), -- FK -> Organizacao
    ('61000000-0000-0000-0000-000000000025','60000000-0000-0000-0000-000000000003','data_criacao',  'TIMESTAMP', TRUE,  FALSE, 6, FALSE, NULL),
    -- VisaoProduto
    ('61000000-0000-0000-0000-000000000030','60000000-0000-0000-0000-000000000004','id',                'UUID', TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000031','60000000-0000-0000-0000-000000000004','projeto_id',        'UUID', TRUE,  FALSE, 2, TRUE,  '60000000-0000-0000-0000-000000000003'), -- FK -> Projeto
    ('61000000-0000-0000-0000-000000000032','60000000-0000-0000-0000-000000000004','descricao_problema','TEXT', FALSE, FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000033','60000000-0000-0000-0000-000000000004','publico_alvo',      'TEXT', FALSE, FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000034','60000000-0000-0000-0000-000000000004','objetivo_geral',    'TEXT', FALSE, FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000035','60000000-0000-0000-0000-000000000004','kpis',              'TEXT', FALSE, FALSE, 6, FALSE, NULL),
    -- Stakeholder
    ('61000000-0000-0000-0000-000000000040','60000000-0000-0000-0000-000000000005','id',           'UUID',      TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000041','60000000-0000-0000-0000-000000000005','usuario_id',   'UUID',      TRUE,  FALSE, 2, TRUE,  '60000000-0000-0000-0000-000000000002'), -- FK -> Usuario
    ('61000000-0000-0000-0000-000000000042','60000000-0000-0000-0000-000000000005','projeto_id',   'UUID',      TRUE,  FALSE, 3, TRUE,  '60000000-0000-0000-0000-000000000003'), -- FK -> Projeto
    ('61000000-0000-0000-0000-000000000043','60000000-0000-0000-0000-000000000005','papel',        'VARCHAR',   TRUE,  FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000044','60000000-0000-0000-0000-000000000005','data_entrada', 'TIMESTAMP', TRUE,  FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000045','60000000-0000-0000-0000-000000000005','ativo',        'BOOLEAN',   TRUE,  FALSE, 6, FALSE, NULL),
    -- Requisito
    ('61000000-0000-0000-0000-000000000050','60000000-0000-0000-0000-000000000006','id',         'UUID',    TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000051','60000000-0000-0000-0000-000000000006','codigo',     'VARCHAR', TRUE,  FALSE, 2, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000052','60000000-0000-0000-0000-000000000006','titulo',     'VARCHAR', TRUE,  FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000053','60000000-0000-0000-0000-000000000006','descricao',  'TEXT',    FALSE, FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000054','60000000-0000-0000-0000-000000000006','tipo',       'VARCHAR', TRUE,  FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000055','60000000-0000-0000-0000-000000000006','versao',     'INTEGER', TRUE,  FALSE, 6, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000056','60000000-0000-0000-0000-000000000006','status',     'VARCHAR', TRUE,  FALSE, 7, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000057','60000000-0000-0000-0000-000000000006','projeto_id', 'UUID',    TRUE,  FALSE, 8, TRUE,  '60000000-0000-0000-0000-000000000003'), -- FK -> Projeto
    -- Comentario
    ('61000000-0000-0000-0000-000000000060','60000000-0000-0000-0000-000000000007','id',           'UUID',      TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000061','60000000-0000-0000-0000-000000000007','requisito_id', 'UUID',      TRUE,  FALSE, 2, TRUE,  '60000000-0000-0000-0000-000000000006'), -- FK -> Requisito
    ('61000000-0000-0000-0000-000000000062','60000000-0000-0000-0000-000000000007','usuario_id',   'UUID',      TRUE,  FALSE, 3, TRUE,  '60000000-0000-0000-0000-000000000002'), -- FK -> Usuario
    ('61000000-0000-0000-0000-000000000063','60000000-0000-0000-0000-000000000007','conteudo',     'TEXT',      TRUE,  FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000064','60000000-0000-0000-0000-000000000007','data_criacao', 'TIMESTAMP', TRUE,  FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000065','60000000-0000-0000-0000-000000000007','editado',      'BOOLEAN',   TRUE,  FALSE, 6, FALSE, NULL),
    -- Evento
    ('61000000-0000-0000-0000-000000000070','60000000-0000-0000-0000-000000000008','id',                'UUID',      TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000071','60000000-0000-0000-0000-000000000008','projeto_id',        'UUID',      TRUE,  FALSE, 2, TRUE,  '60000000-0000-0000-0000-000000000003'), -- FK -> Projeto
    ('61000000-0000-0000-0000-000000000072','60000000-0000-0000-0000-000000000008','nome',              'VARCHAR',   TRUE,  FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000073','60000000-0000-0000-0000-000000000008','descricao',         'TEXT',      FALSE, FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000074','60000000-0000-0000-0000-000000000008','data_hora_inicio',  'TIMESTAMP', TRUE,  FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000075','60000000-0000-0000-0000-000000000008','data_hora_fim',     'TIMESTAMP', FALSE, FALSE, 6, FALSE, NULL),
    -- Auditoria
    ('61000000-0000-0000-0000-000000000080','60000000-0000-0000-0000-000000000009','id',             'UUID',      TRUE,  TRUE,  1, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000081','60000000-0000-0000-0000-000000000009','entidade_tipo',  'VARCHAR',   TRUE,  FALSE, 2, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000082','60000000-0000-0000-0000-000000000009','entidade_id',    'UUID',      TRUE,  FALSE, 3, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000083','60000000-0000-0000-0000-000000000009','campo_alterado', 'VARCHAR',   TRUE,  FALSE, 4, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000084','60000000-0000-0000-0000-000000000009','valor_anterior', 'TEXT',      FALSE, FALSE, 5, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000085','60000000-0000-0000-0000-000000000009','valor_novo',     'TEXT',      FALSE, FALSE, 6, FALSE, NULL),
    ('61000000-0000-0000-0000-000000000086','60000000-0000-0000-0000-000000000009','usuario_id',     'UUID',      TRUE,  FALSE, 7, TRUE,  '60000000-0000-0000-0000-000000000002'), -- FK -> Usuario
    ('61000000-0000-0000-0000-000000000087','60000000-0000-0000-0000-000000000009','data_alteracao', 'TIMESTAMP', TRUE,  FALSE, 8, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── Relacionamentos entre entidades (FKs do domínio) ───────────────────────
--   origem = lado "muitos" (detém a FK); destino = lado "um"
--   atributo_fk_id referencia o atributo marcado como chave_estrangeira acima
--   (mesma correspondência que AtributoEntidadeService.sincronizarPorAtributo
--   cria automaticamente quando a FK é marcada via API/UI).
INSERT INTO relacionamento_entidade (id, entidade_origem_id, entidade_destino_id, tipo, atributo_fk_id) VALUES
    ('62000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000024'), -- Projeto     -> Organizacao (organizacao_id)
    ('62000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000003','UM_PARA_UM',    '61000000-0000-0000-0000-000000000031'), -- VisaoProduto-> Projeto (projeto_id)
    ('62000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000003','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000042'), -- Stakeholder -> Projeto (projeto_id)
    ('62000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000002','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000041'), -- Stakeholder -> Usuario (usuario_id)
    ('62000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000003','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000057'), -- Requisito   -> Projeto (projeto_id)
    ('62000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000006','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000061'), -- Comentario  -> Requisito (requisito_id)
    ('62000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000002','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000062'), -- Comentario  -> Usuario (usuario_id)
    ('62000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000003','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000071'), -- Evento      -> Projeto (projeto_id)
    ('62000000-0000-0000-0000-000000000009','60000000-0000-0000-0000-000000000009','60000000-0000-0000-0000-000000000002','UM_PARA_MUITOS','61000000-0000-0000-0000-000000000086')  -- Auditoria   -> Usuario (usuario_id)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 9. IMPACTO DE DADOS  (liga REQUISITO -> ENTIDADE/ATRIBUTO, com diff antes/depois)
--    Também é a base da camada INDIRETA da matriz: dois requisitos que impactam
--    a MESMA entidade ficam relacionados automaticamente (ex.: RF07/RF09/RF10/RF14
--    sobre "Requisito"; RF04/RF05 sobre "Projeto").
--    tipo_operacao: CRIA_ENTIDADE | ALTERA_ENTIDADE | REMOVE_ENTIDADE |
--                   CRIA_ATRIBUTO | ALTERA_ATRIBUTO | REMOVE_ATRIBUTO
-- =============================================================================

INSERT INTO impacto_dados (id, requisito_id, entidade_id, atributo_id, tipo_operacao, valor_anterior, valor_novo, criado_por, data_criacao) VALUES
    ('80000000-0000-0000-0000-000000000001','4f000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Organizacao" criada com os atributos id, nome, descricao, plano e ativo. Agrupa projetos e usuários.',
     '11111111-0000-0000-0000-000000000002','2026-03-06 14:10:00'),

    ('80000000-0000-0000-0000-000000000002','4f000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Usuario" criada com os atributos id, nome, email (único) e ativo.',
     '11111111-0000-0000-0000-000000000002','2026-03-06 14:11:00'),

    ('80000000-0000-0000-0000-000000000003','4f000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000003',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Projeto" criada com os atributos id, nome, descricao, status, organizacao_id e data_criacao. Pertence a uma Organizacao (N:1).',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:12:00'),

    ('80000000-0000-0000-0000-000000000004','4f000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000005',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Stakeholder" criada (usuario_id, projeto_id, papel, data_entrada, ativo). Associa Usuario a Projeto com um papel.',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:13:00'),

    ('80000000-0000-0000-0000-000000000005','4f000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000003',NULL,'ALTERA_ENTIDADE',
     'Projeto sem participantes associados.','Projeto passa a ter coleção de Stakeholders (participantes com papéis).',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:13:30'),

    ('80000000-0000-0000-0000-000000000006','4f000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000004',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "VisaoProduto" criada (descricao_problema, publico_alvo, objetivo_geral, kpis...). Relação 1:1 com Projeto.',
     '11111111-0000-0000-0000-000000000002','2026-03-06 14:14:00'),

    ('80000000-0000-0000-0000-000000000007','4f000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000006',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Requisito" criada com os atributos codigo, titulo, descricao, tipo, versao, status e projeto_id. Relação N:1 com Projeto.',
     '11111111-0000-0000-0000-000000000001','2026-03-06 14:15:00'),

    ('80000000-0000-0000-0000-000000000008','4f000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000007',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Comentario" criada (requisito_id, usuario_id, conteudo, data_criacao, editado). Relação N:1 com Requisito.',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:16:00'),

    ('80000000-0000-0000-0000-000000000009','4f000000-0000-0000-0000-000000000009','60000000-0000-0000-0000-000000000006','61000000-0000-0000-0000-000000000056','ALTERA_ATRIBUTO',
     'status VARCHAR — alterado livremente pelo responsável do projeto.',
     'status VARCHAR — transição para APROVADO/REPROVADO exige aprovação ou rejeição formal registrada de um stakeholder.',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:17:00'),

    ('80000000-0000-0000-0000-000000000010','4f000000-0000-0000-0000-000000000010','60000000-0000-0000-0000-000000000006','61000000-0000-0000-0000-000000000056','ALTERA_ATRIBUTO',
     'status VARCHAR — texto livre.',
     'status VARCHAR — máquina de estados: PROPOSTO -> EM_ANALISE -> EM_VALIDACAO -> APROVADO | REJEITADO | ALTERADO.',
     '11111111-0000-0000-0000-000000000002','2026-03-08 16:05:00'),

    ('80000000-0000-0000-0000-000000000011','4f000000-0000-0000-0000-000000000014','60000000-0000-0000-0000-000000000006','61000000-0000-0000-0000-000000000055','ALTERA_ATRIBUTO',
     'versao INTEGER — valor fixo definido no cadastro do requisito.',
     'versao INTEGER — incrementada automaticamente a cada alteração aprovada; versões anteriores preservadas para rastreio da evolução.',
     '11111111-0000-0000-0000-000000000003','2026-03-08 16:06:00'),

    ('80000000-0000-0000-0000-000000000012','4f000000-0000-0000-0000-000000000011','60000000-0000-0000-0000-000000000008',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Evento" criada (projeto_id, nome, descricao, data_hora_inicio, data_hora_fim). Reuniões, workshops de discovery e entregas.',
     '11111111-0000-0000-0000-000000000001','2026-03-06 14:18:00'),

    ('80000000-0000-0000-0000-000000000013','4f000000-0000-0000-0000-000000000012','60000000-0000-0000-0000-000000000009',NULL,'CRIA_ENTIDADE',
     NULL,'Entidade "Auditoria" criada (entidade_tipo, entidade_id, campo_alterado, valor_anterior, valor_novo, usuario_id, data_alteracao). Uma linha por campo alterado.',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:19:00'),

    ('80000000-0000-0000-0000-000000000014','4e000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000009',NULL,'ALTERA_ENTIDADE',
     'Auditoria registra apenas alterações de campo.',
     'Auditoria consultada em conjunto com Comentario e Requisito para compor a rastreabilidade entre requisitos, discussões, decisões e histórico.',
     '11111111-0000-0000-0000-000000000003','2026-03-06 14:20:00'),

    ('80000000-0000-0000-0000-000000000015','4f000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000005','61000000-0000-0000-0000-000000000043','CRIA_ATRIBUTO',
     NULL,'papel VARCHAR — define o papel do participante (LIDER, ANALISTA, DESENVOLVEDOR, OBSERVADOR) e as permissões associadas.',
     '11111111-0000-0000-0000-000000000001','2026-03-06 14:21:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 10. COMENTÁRIOS DE DISCUSSÃO (RF08) — amostra em requisitos-chave
-- =============================================================================

INSERT INTO comentario (id, usuario_id, organizacao_id, projeto_id, entidade_tipo, entidade_id, conteudo, ativo, editado, data_criacao, data_atualizacao) VALUES
    ('c0000000-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000009',
     'Precisamos definir se a aprovação exige consenso de todos os stakeholders ou apenas maioria.',TRUE,FALSE,'2026-03-06 09:10:00','2026-03-06 09:10:00'),
    ('c0000000-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000009',
     'Decisão: basta a aprovação formal de ao menos um stakeholder responsável; divergências viram novos requisitos ou solicitações de alteração.',TRUE,FALSE,'2026-03-06 11:00:00','2026-03-06 11:00:00'),
    ('c0000000-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000002','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000014',
     'Gerar uma versão nova a cada alteração pode impactar o desempenho (RNF03)? Vale registrar o trade-off.',TRUE,FALSE,'2026-03-06 09:30:00','2026-03-06 09:30:00'),
    ('c0000000-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000014',
     'Mantemos versionamento leve (apenas o diff dos campos alterados). Trade-off aceito e registrado como vínculo CONFLITA entre RF12 e RNF03.',TRUE,FALSE,'2026-03-06 11:15:00','2026-03-06 11:15:00'),
    ('c0000000-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000004','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000007',
     'Sugiro incluir a rastreabilidade entre requisitos (matriz) como evolução — feedback da banca.',TRUE,FALSE,'2026-06-20 15:00:00','2026-06-20 15:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 11. EVENTOS DO PROJETO (RF11)
-- =============================================================================

--   status: APROVADO (criado por Dono/Gestor ou pedido atendido) | SOLICITADO
--   (pedido de stakeholder aguardando resposta) | REJEITADO
INSERT INTO evento (id, nome, descricao, criado_por, organizacao_id, projeto_id, data_hora_inicio, data_hora_fim, data_criacao, status) VALUES
    ('b0000000-0000-0000-0000-000000000001','Workshop de Discovery','Levantamento das principais dores de gerentes de projeto e stakeholders nas fases de Discovery e Elicitação.',
     '11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','2026-03-05 14:00:00','2026-03-05 16:00:00','2026-03-01 09:00:00','APROVADO'),
    ('b0000000-0000-0000-0000-000000000002','Validação da lista de requisitos','Revisão dos requisitos funcionais e não funcionais com os stakeholders e o orientador.',
     '11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','2026-03-08 10:00:00','2026-03-08 12:00:00','2026-03-06 09:00:00','APROVADO'),
    ('b0000000-0000-0000-0000-000000000003','Apresentação do TCC à banca','Defesa da monografia e do protótipo perante a banca examinadora.',
     '11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','2026-06-25 19:00:00','2026-06-25 20:30:00','2026-06-01 09:00:00','APROVADO'),
    ('b0000000-0000-0000-0000-000000000004','Reunião de evolução pós-banca','Planejamento das evoluções pedidas pela banca: matriz de rastreabilidade dinâmica e modelagem de dados nos requisitos.',
     '11111111-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','2026-08-30 14:00:00','2026-08-30 16:00:00','2026-08-25 09:00:00','APROVADO'),
    -- Pedido do orientador (stakeholder) ainda sem resposta — ver solicitação d0...03
    ('b0000000-0000-0000-0000-000000000005','Revisão do controle de acesso','Validar com o orientador os papéis de organização e projeto implementados (Dono, Gestor, Stakeholder).',
     '11111111-0000-0000-0000-000000000004','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','2026-10-06 19:00:00','2026-10-06 20:00:00','2026-09-27 10:00:00','SOLICITADO')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 11.1 SOLICITAÇÕES (D12) — pedidos de stakeholder ao Dono/Gestor do projeto
--    tipo  : APROVACAO_REQUISITO | ALTERACAO_REQUISITO | REPROVACAO_REQUISITO |
--            EVENTO | EXPORT_MER | EXPORT_RASTREABILIDADE
--    status: PENDENTE | ATENDIDA | RECUSADA | CANCELADA
-- =============================================================================

INSERT INTO solicitacao (id, projeto_id, tipo, alvo_id, status, solicitante_id, justificativa, respondido_por, resposta, data_criacao, data_resposta) VALUES
    -- Plínio (cliente) pede a aprovação do RF03, ainda em revisão
    ('d0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','APROVACAO_REQUISITO','4f000000-0000-0000-0000-000000000003','PENDENTE',
     '11111111-0000-0000-0000-000000000004','Os papéis de organização e projeto já foram validados na reunião pós-banca.',NULL,NULL,'2026-09-27 09:30:00',NULL),
    -- Plínio pediu alteração do RF09 (aprovado); o Gubio atendeu
    ('d0000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','ALTERACAO_REQUISITO','4f000000-0000-0000-0000-000000000009','ATENDIDA',
     '11111111-0000-0000-0000-000000000004','A aprovação deve ser do Dono/Gestor do projeto; o stakeholder só solicita.',
     '11111111-0000-0000-0000-000000000001','Ajustado: stakeholders agora solicitam aprovação e o responsável aprova.','2026-09-20 10:00:00','2026-09-21 14:00:00'),
    -- Plínio pediu um evento (b0...05, SOLICITADO)
    ('d0000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','EVENTO','b0000000-0000-0000-0000-000000000005','PENDENTE',
     '11111111-0000-0000-0000-000000000004','Revisar o controle de acesso antes da entrega final.',NULL,NULL,'2026-09-27 10:00:00',NULL),
    -- Plínio pediu a exportação do MER; atendida (libera o download para ele)
    ('d0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','EXPORT_MER',NULL,'ATENDIDA',
     '11111111-0000-0000-0000-000000000004','Anexar o modelo de dados na versão final da monografia.',
     '11111111-0000-0000-0000-000000000002','Liberado.','2026-09-22 08:00:00','2026-09-22 09:00:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 12. AUDITORIA (RF12) — amostra
-- =============================================================================

INSERT INTO auditoria (id, organizacao_id, projeto_id, entidade_tipo, entidade_id, acao, campo_alterado, valor_anterior, valor_novo, usuario_id, data_alteracao) VALUES
    ('a0000000-0000-0000-0000-000000000001','0f000000-0000-0000-0000-0000000000fa',NULL,'ORGANIZACAO','0f000000-0000-0000-0000-0000000000fa','CRIACAO',NULL,NULL,'Fatesg','11111111-0000-0000-0000-000000000001','2026-02-20 09:00:00'),
    ('a0000000-0000-0000-0000-000000000002','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','PROJETO','20000000-0000-0000-0000-000000000001','CRIACAO',NULL,NULL,'Plataforma para Apoio à Gestão da Fase de Discovery...','11111111-0000-0000-0000-000000000001','2026-02-20 09:00:00'),
    ('a0000000-0000-0000-0000-000000000003','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000001','CRIACAO',NULL,NULL,'RF01 — Cadastro de Organização','11111111-0000-0000-0000-000000000002','2026-03-05 10:00:00'),
    ('a0000000-0000-0000-0000-000000000004','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000007','CRIACAO',NULL,NULL,'RF07 — Cadastro de Requisitos','11111111-0000-0000-0000-000000000001','2026-03-05 10:30:00'),
    ('a0000000-0000-0000-0000-000000000005','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000007','EDICAO','versao','1','2','11111111-0000-0000-0000-000000000001','2026-03-08 16:00:00'),
    ('a0000000-0000-0000-0000-000000000006','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000010','EDICAO','status','EM_REVISAO','APROVADO','11111111-0000-0000-0000-000000000001','2026-03-06 15:00:00'),
    ('a0000000-0000-0000-0000-000000000007','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','REQUISITO','4f000000-0000-0000-0000-000000000010','EDICAO','versao','1','2','11111111-0000-0000-0000-000000000002','2026-03-08 16:00:00'),
    ('a0000000-0000-0000-0000-000000000008','0f000000-0000-0000-0000-0000000000fa','20000000-0000-0000-0000-000000000001','ENTIDADE_DADOS','60000000-0000-0000-0000-000000000006','CRIACAO',NULL,NULL,'Requisito','11111111-0000-0000-0000-000000000001','2026-03-06 14:15:00')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 13. INTERAÇÕES (analytics de engajamento) — amostra
--    modulo: REQUISITO | COMENTARIO | EVENTO | WIKI | MODELAGEM_DADOS | RASTREABILIDADE
--    tipo  : CRIACAO | EDICAO | APROVACAO | COMENTARIO | MUDANCA_STATUS
-- =============================================================================

INSERT INTO interacao (id, usuario_id, projeto_id, modulo, tipo, entidade_id, descricao, data_interacao) VALUES
    ('90000000-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','REQUISITO','CRIACAO','4f000000-0000-0000-0000-000000000001','Criou o requisito RF01','2026-03-05 10:00:00'),
    ('90000000-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQUISITO','CRIACAO','4f000000-0000-0000-0000-000000000007','Criou o requisito RF07','2026-03-05 10:30:00'),
    ('90000000-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','REQUISITO','CRIACAO','4f000000-0000-0000-0000-000000000009','Criou o requisito RF09','2026-03-05 10:40:00'),
    ('90000000-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQUISITO','APROVACAO','4f000000-0000-0000-0000-000000000001','Aprovou o requisito RF01','2026-03-06 15:00:00'),
    ('90000000-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQUISITO','APROVACAO','4f000000-0000-0000-0000-000000000007','Aprovou o requisito RF07','2026-03-06 15:00:00'),
    ('90000000-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','REQUISITO','MUDANCA_STATUS','4f000000-0000-0000-0000-000000000010','Alterou o status de RF10 para APROVADO','2026-03-06 15:00:00'),
    ('90000000-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','COMENTARIO','COMENTARIO','c0000000-0000-0000-0000-000000000001','Comentou em RF09','2026-03-06 09:10:00'),
    ('90000000-0000-0000-0000-000000000008','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','COMENTARIO','COMENTARIO','c0000000-0000-0000-0000-000000000002','Comentou em RF09','2026-03-06 11:00:00'),
    ('90000000-0000-0000-0000-000000000009','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','WIKI','CRIACAO','30000000-0000-0000-0000-000000000001','Registrou a visão do produto','2026-03-05 10:25:00'),
    ('90000000-0000-0000-0000-000000000010','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','EVENTO','CRIACAO','b0000000-0000-0000-0000-000000000001','Agendou o Workshop de Discovery','2026-03-01 09:00:00'),
    ('90000000-0000-0000-0000-000000000011','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','MODELAGEM_DADOS','CRIACAO','60000000-0000-0000-0000-000000000006','Cadastrou a entidade de dados "Requisito"','2026-03-06 14:15:00'),
    ('90000000-0000-0000-0000-000000000012','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','MODELAGEM_DADOS','CRIACAO','60000000-0000-0000-0000-000000000003','Cadastrou a entidade de dados "Projeto"','2026-03-06 14:12:00'),
    ('90000000-0000-0000-0000-000000000013','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','RASTREABILIDADE','CRIACAO','70000000-0000-0000-0000-000000000007','Vinculou RF07 -> RF04 (DEPENDE_DE)','2026-03-06 16:00:00'),
    ('90000000-0000-0000-0000-000000000014','11111111-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','RASTREABILIDADE','CRIACAO','70000000-0000-0000-0000-000000000016','Vinculou RF14 -> RF10 (IMPACTA)','2026-03-08 16:10:00'),
    ('90000000-0000-0000-0000-000000000015','11111111-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','MODELAGEM_DADOS','CRIACAO','80000000-0000-0000-0000-000000000009','Registrou impacto de RF09 no atributo Requisito.status','2026-03-06 14:17:00')
ON CONFLICT (id) DO NOTHING;


COMMIT;

-- =============================================================================
-- 14. VERIFICAÇÃO (opcional) — confira as contagens após rodar o script
-- =============================================================================
-- SELECT 'organizacao'            AS tabela, count(*) FROM organizacao            WHERE id = '0f000000-0000-0000-0000-0000000000fa'
-- UNION ALL SELECT 'projeto',            count(*) FROM projeto            WHERE id = '20000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'visao_produto',      count(*) FROM visao_produto      WHERE projeto_id = '20000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'requisito',          count(*) FROM requisito          WHERE projeto_id = '20000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'criterio_aceite',    count(*) FROM criterio_aceite    WHERE id::text LIKE '50000000-%'
-- UNION ALL SELECT 'vinculo_requisito',  count(*) FROM vinculo_requisito  WHERE id::text LIKE '70000000-%'
-- UNION ALL SELECT 'entidade_dados',     count(*) FROM entidade_dados     WHERE projeto_id = '20000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'atributo_entidade',  count(*) FROM atributo_entidade  WHERE id::text LIKE '61000000-%'
-- UNION ALL SELECT 'relacionamento_ent', count(*) FROM relacionamento_entidade WHERE id::text LIKE '62000000-%'
-- UNION ALL SELECT 'impacto_dados',      count(*) FROM impacto_dados      WHERE id::text LIKE '80000000-%'
-- UNION ALL SELECT 'comentario',         count(*) FROM comentario         WHERE id::text LIKE 'c0000000-%'
-- UNION ALL SELECT 'evento',             count(*) FROM evento             WHERE id::text LIKE 'b0000000-%'
-- UNION ALL SELECT 'solicitacao',        count(*) FROM solicitacao        WHERE id::text LIKE 'd0000000-%'
-- UNION ALL SELECT 'auditoria',          count(*) FROM auditoria          WHERE id::text LIKE 'a0000000-%'
-- UNION ALL SELECT 'interacao',          count(*) FROM interacao          WHERE id::text LIKE '90000000-%';
-- =============================================================================
