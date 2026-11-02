# Infrastructure — Plataforma de Governança de Projetos de Software

## Descrição

Este diretório contém os arquivos responsáveis pela **infraestrutura do ambiente de execução** da plataforma.

A infraestrutura utiliza **Docker e Docker Compose** para orquestrar os serviços necessários para a execução do sistema.

Os principais serviços são:

* Nginx (proxy reverso — ponto de entrada da aplicação)
* Frontend (React)
* Backend (Spring Boot)
* Banco de dados PostgreSQL (bancos `plataforma` e `keycloak`)
* Keycloak (identidade, sessão e grupos de acesso)
* keycloak-init (sincroniza o realm a cada subida)

---

# Estrutura

```
infrastructure/

docker/
 ├── keycloak          # realm-export.json (fonte única do realm)
 ├── keycloak-init     # init.sh + sync_realm.py
 ├── postgres          # init.sql (cria o banco do Keycloak)
 └── nginx             # nginx.conf

deploy/                # ambiente hospedado (compose de produção, HTTPS, scripts de publicação)

docker-compose.yml
.env.example           # modelo do .env local (o .env não é versionado)
```

> O `docker-compose.yml` e o `.env` desta pasta são do **ambiente local de desenvolvimento**. Antes da primeira subida: `cp .env.example .env`. A publicação na nuvem usa `deploy/`, com senhas geradas na VM: veja [`deploy/README.md`](deploy/README.md).

Descrição:

| Diretório            | Função                                                        |
| -------------------- | ------------------------------------------------------------- |
| docker/keycloak      | Definição do realm `plataforma_discovery` (roles, clients, mapper, grupo `/_admin`) |
| docker/keycloak-init | Aplica o `realm-export.json` no realm existente a cada subida  |
| docker/postgres      | Script de inicialização do PostgreSQL                         |
| docker/nginx         | Proxy reverso (`/` → frontend, `/api` e `/swagger-ui` → backend; requisições de até 25 MB para os uploads). Tem os mesmos cabeçalhos de segurança (CSP etc.) e zonas de limite de requisições da produção, com taxas folgadas para os e2e |
| docker-compose.yml   | Orquestração dos containers                                   |
| .env.example         | Modelo das variáveis do ambiente de desenvolvimento (copiar para `.env`) |

---

# Serviços

| Serviço       | Porta no host | Descrição                                                  |
| ------------- | ------------- | ---------------------------------------------------------- |
| nginx         | 80            | Entrada da aplicação: http://localhost (frontend + `/api`) |
| frontend      | —             | Interface web (servida pelo nginx)                         |
| backend       | 8081          | API da aplicação (Swagger em `/swagger-ui.html`)           |
| keycloak      | 8080          | Servidor de identidade (console em `/admin`)               |
| keycloak-init | —             | Executa e termina: sincroniza o realm                      |
| postgres      | 5432          | Banco de dados                                             |

As portas vêm do `.env` (`NGINX_PORT`, `BACKEND_PORT`, `KEYCLOAK_PORT`, `POSTGRES_PORT`).

---

# Executar o ambiente completo

Para subir todos os serviços:

```
docker compose up
```

Para executar em modo background:

```
docker compose up -d
```

---

Para reconstruir só um serviço depois de mudar o código:

```
docker compose up -d --build backend
docker compose build frontend && docker compose up -d --no-deps frontend
```

> O frontend depende do backend no Compose: sem `--no-deps`, reconstruir o frontend reinicia também o backend.

---

# Parar os containers

```
docker compose down
```

---

# Recriar o ambiente de desenvolvimento

Para apagar os dados da aplicação e carregar o projeto de demonstração (banco + usuários e grupos no Keycloak), use o script da raiz do repositório:

```
py scripts/recriar_ambiente_dev.py --confirmar
```

Ele preserva o realm (roles, clients, mapper, `/_admin`) e apaga apenas usuários e grupos de organização. A senha das contas da demo é pedida no terminal (ou lida de `DEV_SENHA_DEMO`). Para carregar ou remover só a demo, sem apagar o resto, e para criar a conta de Admin da Plataforma, veja a seção "Dados iniciais e demonstração" do README principal.

---

# Keycloak — autorização

O modelo completo (papéis, matriz de permissões, decisões) está no documento de arquitetura `autorizacao-organizacao-projeto.md`. Resumo do que a infraestrutura configura:

* **Roles de realm** — 8 papéis compostos (`ORG_OWNER`, `ORG_MANAGER`, `ORG_MEMBER`, `PROJECT_OWNER`, `PROJECT_MANAGER`, `STAKEHOLDER_TECHNICAL`, `STAKEHOLDER_CLIENT`, `PLATFORM_ADMIN`) e 50 permissões. Servem de documentação; o backend decide acesso pelos **grupos** do token, com uma matriz estática no código.
* **Mapper `groups`** no client `plataforma-api-client` — o token passa a ter o claim `groups` com o caminho completo de cada grupo do usuário (ex.: `/org-{uuid}/proj-{uuid}/_gestores`).
* **Grupo `/_admin`** — Admin da Plataforma (mantém status e prioridades). Não dá acesso a organizações nem projetos.
* Os grupos de organização e projeto (`/org-{uuid}/...`) **não** ficam aqui: são criados pelo backend via Admin API.

## Fonte única: `docker/keycloak/realm-export.json`

O Keycloak só importa o `realm-export.json` quando o realm ainda não existe (`--import-realm` ignora realm já criado). Por isso o container `keycloak-init`, a cada subida:

1. dá à service account do `plataforma-admin-client` as roles `manage-users`, `view-users`, `query-users`, `query-groups` e `view-realm`;
2. executa `sync_realm.py`, que aplica o `realm-export.json` no realm existente de forma idempotente: cria roles ausentes, remove roles obsoletas (ex.: `ORG_ADMIN`), deixa as composites exatamente como no arquivo, cria/atualiza o mapper `groups`, cria o grupo `/_admin` e aplica os atributos de segurança do realm.

**Segurança do realm:** proteção contra força bruta (`bruteForceProtected`: 5 falhas seguidas bloqueiam a conta por 1 minuto, crescendo até 15 minutos, sem bloqueio permanente) e política de senha (`length(8) and notUsername and notEmail`). O Keycloak responde igual para senha errada, e-mail inexistente e conta bloqueada, então o login não revela se uma conta existe.

Para mudar roles, composites, mappers ou grupos de topo: edite **apenas** o `realm-export.json` e suba o ambiente de novo (`docker compose up -d --build keycloak-init`). Usuários e grupos de organização/projeto nunca são alterados pelo script.

## Conta de Admin da Plataforma (`/_admin`)

Use `py scripts/criar_admin.py <email>` (na VM, `bash ~/plataforma/criar_admin.sh <email>`): cria a conta pelo cadastro da plataforma, com a senha digitada no terminal, e a põe no `/_admin`. Nenhuma tela da plataforma dá esse papel a alguém.

## Recriar o realm do zero

O banco do Keycloak (`keycloak`) fica no mesmo volume do PostgreSQL (`postgres_data`). Para recriar apenas o realm, sem perder os dados da aplicação:

```
docker compose stop keycloak
docker compose exec postgres psql -U <POSTGRES_USER> -d postgres -c "DROP DATABASE keycloak WITH (FORCE);" -c "CREATE DATABASE keycloak;"
docker compose up -d keycloak keycloak-init
```

Atenção: isso apaga todos os usuários do Keycloak. Os registros da tabela `usuario` do backend ficam órfãos (o `external_identity_id` deixa de existir) — rode em seguida o `scripts/recriar_ambiente_dev.py` (só local) para deixar banco e Keycloak consistentes.

---

# Persistência de dados

Os dados ficam em volumes Docker:

| Volume          | Conteúdo                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `postgres_data` | Bancos `plataforma` (aplicação) e `keycloak`                             |
| `project_files` | Arquivos enviados aos projetos, montado em `/files` no backend (até 20 MB por arquivo) |

`docker compose down` preserva os volumes; `docker compose down -v` apaga todos os dados.

---

# Requisitos

Antes de executar o projeto, certifique-se de possuir:

* Docker
* Docker Compose

---

# Licença

A infraestrutura deste projeto faz parte da **Plataforma de Governança de Projetos de Software** e segue a licença proprietária definida no repositório principal.
