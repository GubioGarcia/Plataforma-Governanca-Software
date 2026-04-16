# Plataforma Discovery — Visão Geral do Projeto

## O que é

A **Plataforma Discovery** é uma aplicação web voltada para a **gestão colaborativa da fase de discovery de projetos de software** — a etapa onde se levantam, discutem e validam os requisitos antes do desenvolvimento começar.

O objetivo é centralizar em um único lugar todas as informações de um projeto: o que precisa ser feito, quem são os envolvidos, o que já foi decidido e o histórico de tudo que aconteceu.

---

## Contexto

Desenvolvida como projeto de **TCC (Trabalho de Conclusão de Curso)**, a plataforma simula um produto real que poderia ser usado por empresas de software para organizar e documentar o processo de elicitação de requisitos com stakeholders de forma estruturada e rastreável.

---

## Estrutura Organizacional

A plataforma é organizada em dois níveis:

```
Organização
└── Projetos
    ├── WIKI
    ├── Requisitos
    ├── Eventos
    ├── Arquivos
    ├── Stakeholders
    └── Auditoria
```

### Organização
Representa uma empresa ou time. Cada organização tem um plano (FREE ou PRO) e agrupa todos os seus projetos e membros.

**Exemplo:** TechCorp Solutions (plano PRO) e StartupXYZ (plano FREE).

### Projeto
Cada projeto dentro de uma organização tem um status de ciclo de vida:

| Status | Descrição |
|---|---|
| `PLANEJAMENTO` | Projeto em fase inicial, requisitos sendo levantados |
| `EM_DESENVOLVIMENTO` | Discovery em andamento, requisitos sendo validados |
| `CONCLUÍDO` | Projeto finalizado e documentado |
| `SUSPENSO` | Projeto pausado |

---

## Módulos do Sistema

### 📋 WIKI do Projeto
Documentação estruturada do projeto em seções (Objetivo Geral, KPIs, Restrições, Glossário, etc.).

Cada seção tem um fluxo de aprovação próprio:
- **Rascunho** → o gestor ou analista escreve
- **Em Validação** → enviado para feedback dos stakeholders
- **Aprovado** → stakeholders votaram positivamente
- **Validado** → gestor fez a validação final

---

### ✅ Requisitos
O coração da plataforma. Cada requisito passa por um funil de status:

```
RASCUNHO → EM_ANÁLISE → EM_VALIDAÇÃO → APROVADO → VALIDADO
```

Funcionalidades:
- Listagem com filtros por status, tipo e busca textual
- Criação e edição com título, descrição, prioridade e tipo (FUNCIONAL / NÃO_FUNCIONAL)
- Thread de comentários em cada requisito para discussão entre a equipe
- Paginação para projetos com muitos requisitos

---

### 📅 Eventos
Linha do tempo de eventos do projeto (reuniões, workshops, revisões, entregas, demos).

Cada evento tem: nome, descrição, tipo, data, e quem criou.

---

### 📁 Arquivos
Repositório de documentos do projeto. Suporta upload de qualquer formato (PDF, Word, Excel, imagens, Figma, etc.), com rastreabilidade de quem enviou e quando.

---

### 👥 Stakeholders
Lista de todos os envolvidos no projeto com seus papéis e nível de participação (total de interações).

**Papéis disponíveis:**

| Papel | O que pode fazer |
|---|---|
| **GESTOR** | Tudo: editar, enviar para validação, validar, gerenciar membros, ver auditoria |
| **ANALISTA** | Criar e editar conteúdo, ver auditoria |
| **STAKEHOLDER** | Votar (aprovar/reprovar) em requisitos e seções da WIKI |
| **DESENVOLVEDOR** | Visualização geral do projeto |

---

### 🔍 Auditoria
Log completo e imutável de todas as ações realizadas no projeto: quem fez o quê, em qual entidade, e quando. Visível apenas para Gestores e Analistas.

---

### 📊 Analytics
Painel de métricas do projeto com gráficos de:
- Distribuição de requisitos por status
- Evolução temporal dos requisitos ao longo do tempo
- Engajamento dos stakeholders
- Comparativo com médias da organização

---

### 🏠 Dashboard do Projeto
Página inicial de cada projeto com visão consolidada:
- **KPIs** rápidos (total de requisitos, aprovados, em validação, participação na WIKI)
- **Funil de Requisitos** — distribuição visual por status
- **Próximos Eventos** — os 3 eventos mais próximos
- **Top Stakeholders** — os mais engajados
- **Atividade Recente** — últimas 5 ações do audit log

---

## Perfil e Configurações

- **Página de Perfil** — nome, e-mail, organização e papel do usuário logado
- **Troca de papel (demo)** — botão para alternar entre os papéis (Gestor, Analista, Stakeholder, Desenvolvedor) e visualizar como a interface se comporta para cada um
- **Tema** — suporte a dark mode e light mode

---

## Autenticação e Segurança

- Autenticação via **Keycloak** (OAuth2 / OpenID Connect)
- Rotas protegidas — usuário não autenticado é redirecionado para o login
- Permissões controladas por papel em todas as ações (editar, aprovar, validar, gerenciar membros)
- Para o TCC, o fluxo de autenticação está mockado localmente (login direto sem servidor Keycloak)

---

## Dados de Demonstração

O projeto possui **dados mockados completos** para 2 organizações e 6 projetos:

| Organização | Projetos |
|---|---|
| TechCorp Solutions | Plataforma Discovery, Portal RH Interno, App Mobile Clientes |
| StartupXYZ | EduPlat — LMS, App Gestão de Eventos, Portal de Transparência Pública |

Cada projeto tem requisitos, stakeholders, eventos, arquivos, wiki e histórico de auditoria preenchidos, permitindo uma demonstração completa de todas as funcionalidades.

---

## Fluxo Principal de Uso

```
1. Usuário faz login
2. Seleciona uma organização
3. Seleciona um projeto
4. Visualiza o Dashboard com o resumo do projeto
5. Navega pelos módulos: WIKI, Requisitos, Eventos, Arquivos, Stakeholders, Auditoria
6. Cria/edita requisitos e seções de WIKI (se Gestor ou Analista)
7. Stakeholders recebem notificações e votam nos itens em validação
8. Gestor realiza a validação final
9. Todo histórico fica registrado no Audit Log
```
