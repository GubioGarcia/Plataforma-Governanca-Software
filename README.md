# Plataforma de Governança de Projetos de Software

## ⚠️ Versão MVP

> **Esta é a versão MVP (Minimum Viable Product) da plataforma.**
> O projeto está em desenvolvimento ativo e novas funcionalidades estão sendo implementadas continuamente. Alterações, melhorias e expansão de recursos ainda estão em andamento.

---

## Demonstração

Para uma visão geral do uso básico da plataforma, assista ao vídeo de demonstração disponível no repositório:

📽️ **[`Demonstracao_MVP.mp4`](./Demonstracao_MVP.mp4)**

O vídeo apresenta um uso básico das principais funcionalidades disponíveis nesta versão MVP.

---

## Descrição

A **Plataforma de Governança de Projetos de Software** tem como objetivo apoiar a gestão das fases iniciais de desenvolvimento de software, especialmente **discovery** e **elicitação de requisitos**.

O sistema centraliza informações do projeto, permitindo que **gestores, equipe técnica e stakeholders** acompanhem e registrem artefatos importantes como requisitos, objetivos, eventos e documentos do projeto.

A plataforma busca melhorar a **organização, rastreabilidade e colaboração** durante a definição do escopo de projetos de software.

---

## Tecnologias

### Backend

| Tecnologia | Versão | Descrição |
|---|---|---|
| Java | 21 | Linguagem principal |
| Spring Boot | 4.0.3 | Framework de aplicação |
| Spring Security + OAuth2 | — | Segurança e autorização via JWT |
| Spring Data JPA | — | Persistência e acesso a dados |
| Keycloak | 24.0.2 | Servidor de autenticação (SSO / OpenID Connect) |
| Flyway | — | Controle de versão e migração de banco de dados |
| SpringDoc OpenAPI (Swagger) | 2.5.0 | Documentação da API REST |
| Lombok | — | Redução de boilerplate |
| PostgreSQL | 15 | Banco de dados relacional |

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
| Axios | v1 | Cliente HTTP com interceptors de autenticação |
| Keycloak JS | 26.2 | Integração com autenticação SSO no browser |
| Day.js | v1 | Manipulação e formatação de datas |

**Principais características do frontend:**

- Arquitetura orientada a **feature modules** (`features/audit`, `features/requirements`, `features/wiki`, etc.)
- Suporte a **dark/light mode** via tema MUI customizável
- Sistema global de notificações (toast) via `SnackbarContext`
- Controle de acesso baseado em papéis (roles) via `usePermissions`
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
docker-compose up -d --build
```

> Você também pode omitir o `-d` para acompanhar os logs em tempo real no terminal:
> ```bash
> docker-compose up --build
> ```

3. Aguarde todos os containers iniciarem (o Keycloak pode levar alguns instantes na primeira execução) e acesse a plataforma no navegador:

```
http://localhost
```

**Serviços internos disponíveis após a inicialização:**

| Serviço | Endereço | Descrição |
|---|---|---|
| Frontend | http://localhost | Interface web (via Nginx) |
| Backend API | http://localhost:8081 | API REST Spring Boot |
| Keycloak | http://localhost:8080 | Painel de administração de autenticação |
| PostgreSQL | localhost:5432 | Banco de dados (acesso via cliente SQL) |

---

## Variáveis de Ambiente (.env)

> ⚠️ **Atenção:** O arquivo `.env` disponível neste repositório contém **dados de ambiente de desenvolvimento** (senhas e credenciais genéricas para execução local). Esses valores **não devem ser replicados em ambientes de produção**.
>
> O arquivo está disponibilizado no repositório **apenas para fins de demonstração de preenchimento**, facilitando a execução local do projeto sem configurações adicionais. Em ambientes de produção, todas as variáveis devem ser redefinidas com valores seguros e não devem ser versionadas.

---

## Estrutura do Projeto

```
backend/          # API Spring Boot (Java 21 + Spring Boot 4)
frontend/         # SPA React 19 + TypeScript + Vite
infrastructure/   # Docker Compose, Nginx, Keycloak e PostgreSQL
```

---

## Licença

Copyright (c) 2026 Gubio Garcia

**Todos os direitos reservados.**

Este projeto é um software proprietário.
Nenhuma permissão é concedida para **usar, copiar, modificar, distribuir ou comercializar** este software sem autorização prévia por escrito do autor.

O uso não autorizado deste software é estritamente proibido.

Para solicitações de licença ou uso, entre em contato com o autor.
