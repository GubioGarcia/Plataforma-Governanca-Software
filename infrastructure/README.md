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

docker-compose.yml
.env
```

Descrição:

| Diretório            | Função                                                        |
| -------------------- | ------------------------------------------------------------- |
| docker/keycloak      | Definição do realm `plataforma_discovery` (roles, clients, mapper, grupo `/_admin`) |
| docker/keycloak-init | Aplica o `realm-export.json` no realm existente a cada subida  |
| docker/postgres      | Script de inicialização do PostgreSQL                         |
| docker/nginx         | Proxy reverso (`/` → frontend, `/api` → backend)              |
| docker-compose.yml   | Orquestração dos containers                                   |
| .env                 | Variáveis do ambiente de desenvolvimento                      |

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

Ele preserva o realm (roles, clients, mapper, `/_admin`) e apaga apenas usuários e grupos de organização. Detalhes e contas criadas no README principal.

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
2. executa `sync_realm.py`, que aplica o `realm-export.json` no realm existente de forma idempotente: cria roles ausentes, remove roles obsoletas (ex.: `ORG_ADMIN`), deixa as composites exatamente como no arquivo, cria/atualiza o mapper `groups` e cria o grupo `/_admin`.

Para mudar roles, composites, mappers ou grupos de topo: edite **apenas** o `realm-export.json` e suba o ambiente de novo (`docker compose up -d --build keycloak-init`). Usuários e grupos de organização/projeto nunca são alterados pelo script.

## Incluir um usuário no `/_admin`

Pelo console (`http://localhost:8080/admin` → realm `plataforma_discovery` → *Users* → usuário → *Groups* → *Join group* → `_admin`), ou pela Admin API. O usuário precisa fazer login de novo para o token trazer o grupo.

## Recriar o realm do zero

O banco do Keycloak (`keycloak`) fica no mesmo volume do PostgreSQL (`postgres_data`). Para recriar apenas o realm, sem perder os dados da aplicação:

```
docker compose stop keycloak
docker compose exec postgres psql -U <POSTGRES_USER> -d postgres -c "DROP DATABASE keycloak WITH (FORCE);" -c "CREATE DATABASE keycloak;"
docker compose up -d keycloak keycloak-init
```

Atenção: isso apaga todos os usuários do Keycloak. Os registros da tabela `usuario` do backend ficam órfãos (o `external_identity_id` deixa de existir) — rode em seguida o `scripts/recriar_ambiente_dev.py` para deixar banco e Keycloak consistentes.

---

# Persistência de dados

O banco PostgreSQL utiliza volumes Docker para persistência de dados.

Volume utilizado:

```
postgres_data
```

---

# Requisitos

Antes de executar o projeto, certifique-se de possuir:

* Docker
* Docker Compose

---

# Licença

A infraestrutura deste projeto faz parte da **Plataforma de Governança de Projetos de Software** e segue a licença proprietária definida no repositório principal.
