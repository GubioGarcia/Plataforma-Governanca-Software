# Plataforma de Governança de Projetos de Software

## Descrição

A **Plataforma de Governança de Projetos de Software** tem como objetivo apoiar a gestão das fases iniciais de desenvolvimento de software, especialmente **discovery** e **elicitação de requisitos**.

O sistema centraliza informações do projeto, permitindo que **gestores, equipe técnica e stakeholders** acompanhem e registrem artefatos importantes como requisitos, objetivos, eventos e documentos do projeto.

A plataforma busca melhorar a **organização, rastreabilidade e colaboração** durante a definição do escopo de projetos de software.

---

## Tecnologias

### Backend

* Java
* Spring Boot
* Spring Security
* Keycloak

### Frontend

* A definir

### Infraestrutura

* Docker
* PostgreSQL

---

## Arquitetura

O sistema segue o modelo de **Monólito Modular orientado a Domínio**, com separação clara entre os módulos de negócio.

Principais características da arquitetura:

* Separação por **módulos de domínio**
* Baixo acoplamento entre módulos
* Alta coesão das responsabilidades
* Facilidade de manutenção e evolução do sistema
* Possibilidade de evolução futura para **microserviços**

---

## Executar o projeto localmente

Pré-requisitos:

* Docker
* Docker Compose

Para iniciar todos os serviços do sistema:

```
docker compose up
```

Após iniciar os containers, os serviços estarão disponíveis em:

| Serviço     | Endereço              |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Keycloak    | http://localhost:8081 |

---

## Estrutura do Projeto

```
backend/          # API Spring Boot
frontend/         # A definir
infrastructure/   # Configurações Docker e infraestrutura
```

---

## Licença

Copyright (c) 2026 Gubio Garcia

**Todos os direitos reservados.**

Este projeto é um software proprietário.
Nenhuma permissão é concedida para **usar, copiar, modificar, distribuir ou comercializar** este software sem autorização prévia por escrito do autor.

O uso não autorizado deste software é estritamente proibido.

Para solicitações de licença ou uso, entre em contato com o autor.
