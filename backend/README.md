# Backend — Plataforma de Governança de Projetos de Software

## Descrição

Este módulo contém a **API backend** da Plataforma de Governança de Projetos de Software.

A aplicação é responsável pelas regras de negócio do sistema, incluindo:

* organizações, projetos, membros e convites
* visão do produto (wiki), requisitos, critérios de aceite e aprovação
* solicitações dos stakeholders ao gestor do projeto
* matriz de rastreabilidade e modelagem de dados
* eventos, arquivos, comentários, auditoria e analytics
* exportação em CSV
* sessão (login, renovação, revogação) e controle de acesso por organização/projeto

A API foi desenvolvida utilizando **Java 21 e Spring Boot 4**, seguindo uma arquitetura **Monólito Modular orientada a Domínio**.

---

# Tecnologias

* Java 21
* Spring Boot 4.0.3
* Spring Security + OAuth2 Resource Server (JWT)
* Keycloak 24 (identidade, sessão e grupos de acesso — Admin API)
* Spring Data JPA / Hibernate
* PostgreSQL 15
* SpringDoc OpenAPI (Swagger)
* JUnit 5, Mockito e H2 (testes)
* Docker

---

# Arquitetura

O backend segue o padrão **Modular Monolith**, onde o sistema é dividido em módulos de domínio.

```
src/main/java/io/github/gubiogarcia/plataforma_governanca_software/

config/            # SecurityConfig, validação do JWT (revogação), tratamento global de erros
security/authz/    # Motor de autorização: papéis, permissões e matriz papel → permissão
shared/            # Utilitários comuns
modules/
 ├── identity        # usuários, login/sessão, /me, grupos de acesso no Keycloak
 ├── organization    # organizações
 ├── project         # projetos, status de projeto, eventos
 ├── membership      # membros/participantes e convites
 ├── product         # visão do produto (wiki)
 ├── requirement     # requisitos, status, prioridades, critérios de aceite, aprovação
 ├── solicitation    # solicitações de stakeholders
 ├── traceability    # vínculos entre requisitos e matriz de rastreabilidade
 ├── datamodel       # entidades, atributos (PK/FK), relacionamentos e impacto em dados
 ├── collaboration   # comentários
 ├── files           # arquivos do projeto
 ├── export          # exportação CSV (modelagem e rastreabilidade)
 ├── audit           # auditoria (somente leitura pela API)
 └── interaction     # interações/engajamento (analytics)
```

Cada módulo possui sua própria separação em camadas:

* Controller
* Service
* Domain
* Repository
* DTO

---

# Configuração

As configurações da aplicação estão em:

```
src/main/resources/application.properties
```

Os valores sensíveis (datasource, clients e segredos do Keycloak) vêm de variáveis de ambiente injetadas pelo Docker Compose (`infrastructure/.env`). Outras propriedades relevantes:

| Propriedade | Padrão | Descrição |
| --- | --- | --- |
| `plataforma.auth.cookie-seguro` (`AUTH_COOKIE_SECURE`) | `false` | Marca o cookie do refresh token como `Secure` — use `true` em produção (HTTPS) |
| `plataforma.grupos-acesso.migrar-na-inicializacao` | `true` | Na inicialização, cria no Keycloak os grupos de organizações/projetos que ainda não têm |

## Banco de dados

* O schema é gerado pelo **Hibernate** a partir das entidades (`ddl-auto=update`) e os dados de referência (status e prioridades) vêm do `data.sql`, executado a cada inicialização de forma idempotente.
* O Flyway está **desligado**. Os scripts em `src/main/resources/db/migration` (V1–V3) são mantidos como **referência do modelo** e correspondem ao schema atual (MER V3).
* Para recriar o banco de desenvolvimento com o projeto de demonstração, use `scripts/recriar_ambiente_dev.py` (ver README principal).

---

# Executar a aplicação

O backend é executado através do ambiente Docker definido na pasta **infrastructure**:

```
cd infrastructure
docker compose up -d --build backend
```

Para rodar apenas o backend fora do Docker (com PostgreSQL e Keycloak no ar e as variáveis de ambiente definidas):

```
./mvnw spring-boot:run
```

---

# Porta padrão

| Serviço     | Porta | Endereço |
| ----------- | ----- | -------- |
| Backend API | 8081  | http://localhost:8081/api |
| Swagger     | 8081  | http://localhost:8081/swagger-ui.html |

---

# Segurança

## Autenticação e sessão

* `POST /api/auth/login` — valida as credenciais no Keycloak e devolve o **access token** no corpo; o **refresh token** vai num cookie `HttpOnly` (`plataforma_refresh`, `SameSite=Strict`, `Path=/api/auth`).
* `POST /api/auth/refresh` — renova a sessão pelo cookie (o front chama sozinho ao receber 401).
* `POST /api/auth/logout` — encerra a sessão no Keycloak e apaga o cookie.
* `GET /api/auth/me` — dados do usuário e, para cada organização/projeto em que atua, o papel e as permissões efetivas. É o que o frontend usa para montar as telas.

## Autorização

* Os papéis ficam em **grupos do Keycloak**, nomeados pelo UUID do registro (`/org-{id}/_dono|_gestores|_membros`, `/org-{id}/proj-{id}/_dono|_gestores|_stakeholders_tecnicos|_stakeholders_clientes`, `/_admin`). O token traz o claim `groups` com esses caminhos.
* O pacote `security/authz` resolve o papel do usuário em cada organização/projeto (com herança: Dono/Gestor/Membro da organização valem em todos os projetos dela) e aplica a **matriz estática papel → permissão** (`MatrizPermissoes`). Cada endpoint confere a permissão necessária (`AutorizacaoService.exigir`); sem permissão a resposta é **403**, e listagens mostram só o que o usuário pode ver.
* Os grupos são mantidos pelo backend via Admin API (`GruposAcessoService`): criar organização/projeto cria a estrutura e põe o criador no `_dono`; convites aceitos, promoções e remoções alteram os grupos.
* **Revogação:** quando os grupos de um usuário mudam, o campo `usuario.tokens_revogados_antes_de` é atualizado e tokens emitidos antes disso passam a ser recusados (401); o front renova a sessão e recebe os papéis novos.

O modelo completo está no documento de arquitetura `autorizacao-organizacao-projeto.md`.

---

# Testes

```
./mvnw clean test
```

Testes unitários e de integração (H2 em memória, Keycloak simulado), incluindo as regras de acesso de cada papel e um teste que compara a matriz de permissões do código com as roles compostas do `realm-export.json` — mudar uma exige mudar a outra.

Os testes ponta a ponta contra o ambiente Docker estão em `scripts/e2e/` (API) e `frontend/e2e/` (interface).

---

# Licença

Este módulo faz parte da **Plataforma de Governança de Projetos de Software** e está protegido pela licença proprietária definida no repositório principal.
