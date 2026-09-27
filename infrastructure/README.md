# Infrastructure — Plataforma de Governança de Projetos de Software

## Descrição

Este diretório contém os arquivos responsáveis pela **infraestrutura do ambiente de execução** da plataforma.

A infraestrutura utiliza **Docker e Docker Compose** para orquestrar os serviços necessários para a execução do sistema.

Os principais serviços são:

* Backend (Spring Boot)
* Frontend (React)
* Banco de dados PostgreSQL
* Keycloak (Autenticação e autorização)

---

# Estrutura

```
infrastructure/

docker/
 ├── keycloak
 ├── postgres
 └── nginx

docker-compose.yml
```

Descrição:

| Diretório          | Função                             |
| ------------------ | ---------------------------------- |
| docker/keycloak    | Configuração e importação de realm |
| docker/postgres    | Scripts de inicialização do banco  |
| docker/nginx       | Configuração de proxy reverso      |
| docker-compose.yml | Orquestração dos containers        |

---

# Serviços

| Serviço  | Porta | Descrição                |
| -------- | ----- | ------------------------ |
| frontend | 3000  | Interface web            |
| backend  | 8080  | API da aplicação         |
| keycloak | 8081  | Servidor de autenticação |
| postgres | 5432  | Banco de dados           |

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

# Parar os containers

```
docker compose down
```

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

Atenção: isso apaga todos os usuários do Keycloak. Os registros da tabela `usuario` do backend ficam órfãos (o `external_identity_id` deixa de existir).

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
