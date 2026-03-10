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
