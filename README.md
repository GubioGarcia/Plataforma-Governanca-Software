# Plataforma de Governança de Projetos de Software

## ⚠️ Versão MVP

> **Esta é a versão MVP (Minimum Viable Product) da plataforma.**
> O projeto está em desenvolvimento ativo e novas funcionalidades estão sendo implementadas continuamente. Alterações, melhorias e expansão de recursos ainda estão em andamento.

---

## Demonstração

Para uma visão geral do uso básico da plataforma, assista ao vídeo de demonstração disponível no repositório:

📽️ **[`Demonstracao_MVP.mp4`](https://drive.google.com/file/d/1BQ_yIf2ELcNVmNYs-FyHYtrlvP3erlQy/view?usp=drive_link)**

O vídeo apresenta um uso básico das principais funcionalidades disponíveis nesta versão MVP.

---

## Descrição

A **Plataforma de Governança de Projetos de Software** tem como objetivo apoiar a gestão das fases iniciais de desenvolvimento de software, especialmente **discovery** e **elicitação de requisitos**.

O sistema centraliza informações do projeto, permitindo que **gestores, equipe técnica e stakeholders** acompanhem e registrem artefatos importantes como requisitos, objetivos, eventos e documentos do projeto.

A plataforma busca melhorar a **organização, rastreabilidade e colaboração** durante a definição do escopo de projetos de software.

Principais funcionalidades:

- **Organizações e projetos** com membros, convites e papéis por organização e por projeto
- **Visão do produto (wiki)**: problema, público-alvo, objetivos, KPIs e restrições
- **Requisitos** com critérios de aceite, prioridade, comentários e **aprovação formal** pelo Dono/Gestor
- **Solicitações** dos stakeholders ao gestor: aprovação, alteração ou reprovação de requisito, eventos e exportações
- **Matriz de rastreabilidade** entre requisitos (vínculos diretos e indiretos pelo impacto em dados)
- **Modelagem de dados** do projeto (entidades, atributos, PK/FK e diagrama ER) ligada aos requisitos
- **Eventos**, **arquivos**, **auditoria** de alterações e **analytics** de engajamento
- **Exportação em CSV** da modelagem de dados e da matriz de rastreabilidade

---

## Tecnologias

### Backend

| Tecnologia | Versão | Descrição |
|---|---|---|
| Java | 21 | Linguagem principal |
| Spring Boot | 4.0.3 | Framework de aplicação |
| Spring Security + OAuth2 Resource Server | — | Validação do JWT e autorização por grupos |
| Spring Data JPA / Hibernate | — | Persistência (schema gerado pelas entidades) |
| Keycloak | 24.0.2 | Identidade, sessão e grupos de acesso |
| SpringDoc OpenAPI (Swagger) | 2.5.0 | Documentação da API REST |
| Lombok | — | Redução de boilerplate |
| PostgreSQL | 15 | Banco de dados relacional |
| JUnit 5 + Mockito + H2 | — | Testes unitários e de integração |

### Frontend

| Tecnologia | Versão | Descrição |
|---|---|---|
| React | 19 | Biblioteca principal de UI (SPA) |
| TypeScript | 5.9 | Tipagem estática |
| Vite | 7 | Ferramenta de build e servidor de desenvolvimento |
| Material UI (MUI) | v7 | Biblioteca de componentes (Material Design) |
| React Router DOM | v7 | Roteamento client-side e rotas protegidas |
| TanStack React Query | v5 | Gerenciamento de estado assíncrono e cache |
| React Hook Form + Zod | v7 / v4 | Formulários e validação com type-safety |
| Axios | v1 | Cliente HTTP com renovação automática da sessão |
| Day.js | v1 | Manipulação e formatação de datas |
| Playwright | 1.63 | Testes ponta a ponta da interface |

**Principais características do frontend:**

- Arquitetura orientada a **feature modules** (`features/requirements`, `features/wiki`, `features/solicitations`, etc.)
- Suporte a **dark/light mode** via tema MUI customizável
- Sistema global de notificações (toast) via `SnackbarContext`
- Tela adaptada ao papel do usuário: o hook `usePermissions` lê as permissões reais de `/api/auth/me` (o backend confere tudo de novo)
- Proxy reverso via **Nginx** — o frontend é servido em conjunto com a API sem exposição direta das portas dos serviços internos

### Infraestrutura

| Tecnologia | Descrição |
|---|---|
| Docker | Containerização dos serviços |
| Docker Compose | Orquestração do ambiente completo |
| Nginx | Proxy reverso (roteamento `/api` → backend, `/` → frontend) |
| PostgreSQL | Banco de dados com persistência via volume Docker |

---

## Arquitetura

O sistema segue o modelo de **Monólito Modular orientado a Domínio**, com separação clara entre os módulos de negócio.

Principais características da arquitetura:

- Separação por **módulos de domínio**
- Baixo acoplamento entre módulos
- Alta coesão das responsabilidades
- Facilidade de manutenção e evolução do sistema
- Possibilidade de evolução futura para **microserviços**

---

## Controle de acesso

A autorização é por **organização e projeto**, com os papéis mantidos em **grupos do Keycloak** (um grupo por organização e por projeto, nomeados pelo UUID do registro):

| Onde | Papel | O que faz |
|---|---|---|
| Organização | **Dono** (único) | Tudo na organização: editar, convidar, promover e remover membros; é Dono de todos os projetos dela |
| Organização | **Gestor** | Cria projetos, convida e promove; é Gestor de todos os projetos da organização |
| Organização | **Membro** | Participa de todos os projetos como Stakeholder Técnico |
| Projeto | **Dono / Gestor** | Edita o conteúdo do projeto, aprova requisitos, responde solicitações, exporta |
| Projeto | **Stakeholder Técnico** | Consulta, comenta e faz solicitações (alteração, reprovação, evento, exportação) |
| Projeto | **Stakeholder Cliente** | Como o Técnico, e também solicita a aprovação de requisitos |
| Plataforma | **Admin da Plataforma** | Mantém status e prioridades e as contas; não tem acesso automático aos projetos |

- O login é feito pela API; o token de acesso fica em memória e a sessão é renovada por um **refresh token em cookie HttpOnly** (`/api/auth/refresh`).
- Quando os papéis de alguém mudam (entrou, foi promovido ou removido), os tokens dessa pessoa são **revogados** na hora e a sessão é renovada com os papéis novos.
- Os convites são por e-mail; quem ainda não tem conta se cadastra com o mesmo e-mail e aceita ao entrar.

O modelo completo (decisões, matriz de permissões, sessão) está no documento de arquitetura `autorizacao-organizacao-projeto.md`.

---

## Executar o projeto localmente

**Pré-requisitos:**

- Docker
- Docker Compose

**Passo a passo:**

1. Clone o repositório e acesse a pasta de infraestrutura:

```bash
cd infrastructure
```

2. Suba todos os serviços com build das imagens:

```bash
docker compose up -d --build
```

> Você também pode omitir o `-d` para acompanhar os logs em tempo real no terminal:
> ```bash
> docker compose up --build
> ```

3. Aguarde todos os containers iniciarem (o Keycloak pode levar alguns instantes na primeira execução) e acesse a plataforma no navegador:

```
http://localhost
```

4. (Opcional) Carregue o projeto de demonstração — veja [Dados de demonstração](#dados-de-demonstração).

**Serviços internos disponíveis após a inicialização:**

| Serviço | Endereço | Descrição |
|---|---|---|
| Frontend | http://localhost | Interface web (via Nginx) |
| Backend API | http://localhost:8081 | API REST Spring Boot |
| Swagger | http://localhost:8081/swagger-ui.html | Documentação interativa da API |
| Keycloak | http://localhost:8080 | Painel de administração de autenticação |
| PostgreSQL | localhost:5432 | Banco de dados (acesso via cliente SQL) |

---

## Dados de demonstração

O script `scripts/recriar_ambiente_dev.py` recria o ambiente de desenvolvimento do zero e carrega o projeto do próprio TCC (`scripts/seed_tcc_projeto_demo.sql`): organização Fatesg, o projeto com 27 requisitos, rastreabilidade, modelagem de dados, eventos e solicitações.

```bash
py scripts/recriar_ambiente_dev.py --confirmar
```

> ⚠️ **Destrutivo:** apaga o banco da aplicação, todos os usuários do realm e os grupos de organização no Keycloak. Use apenas no ambiente local.

Contas criadas (senha padrão `Demo@2026`, configurável por `DEV_SENHA_DEMO`):

| Conta | Papel |
|---|---|
| gubiogarcia@gmail.com | Dono da organização e do projeto + Admin da Plataforma |
| luizfernandopadua@gmail.com | Gestor da organização |
| thiagomatheus@gmail.com | Gestor da organização |
| plinio.carneiro@fatesg.senai.br | Stakeholder Técnico + Cliente do projeto |

---

## Testes

| O quê | Como executar | Cobertura |
|---|---|---|
| Backend (unitários e integração) | `./mvnw clean test` em `backend/plataforma-governanca-software` | Regras de negócio e de acesso (H2, Keycloak simulado) |
| API ponta a ponta | `py scripts/e2e/e2e_autorizacao.py` | 160 verificações contra o ambiente Docker: sessão, grupos, papéis em cada módulo, convites, solicitações, exportação |
| Interface ponta a ponta | `npm run test:e2e` em `frontend` | Navegador real (Playwright): o que cada papel vê e faz nas telas |

Os testes ponta a ponta criam usuários e organizações descartáveis e apagam tudo no fim — não interferem nos dados de demonstração.

---

## Variáveis de Ambiente (.env)

> ⚠️ **Atenção:** O arquivo `.env` disponível neste repositório contém **dados de ambiente de desenvolvimento** (senhas e credenciais genéricas para execução local). Esses valores **não devem ser replicados em ambientes de produção**.
>
> O arquivo está disponibilizado no repositório **apenas para fins de demonstração de preenchimento**, facilitando a execução local do projeto sem configurações adicionais. Em ambientes de produção, todas as variáveis devem ser redefinidas com valores seguros e não devem ser versionadas.
>
> Em produção, defina também `AUTH_COOKIE_SECURE=true` para o cookie de sessão só trafegar em HTTPS.

---

## Estrutura do Projeto

```
backend/          # API Spring Boot (Java 21 + Spring Boot 4)
frontend/         # SPA React 19 + TypeScript + Vite (+ testes Playwright em e2e/)
infrastructure/   # Docker Compose, Nginx, Keycloak e PostgreSQL
scripts/          # Seed de demonstração, recriação do ambiente de dev e e2e da API
```

---

## Licença

Copyright (c) 2026 Gubio Garcia

**Todos os direitos reservados.**

Este projeto é um software proprietário.
Nenhuma permissão é concedida para **usar, copiar, modificar, distribuir ou comercializar** este software sem autorização prévia por escrito do autor.

O uso não autorizado deste software é estritamente proibido.

Para solicitações de licença ou uso, entre em contato com o autor.
