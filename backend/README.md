# Backend — Plataforma de Governança de Projetos de Software

## Descrição

Este módulo contém a **API backend** da Plataforma de Governança de Projetos de Software.

A aplicação é responsável por gerenciar as regras de negócio do sistema, incluindo:

* gerenciamento de projetos
* gestão de requisitos
* controle de usuários e permissões
* auditoria de alterações
* armazenamento e recuperação de artefatos

A API foi desenvolvida utilizando **Java e Spring Boot**, seguindo uma arquitetura **Monólito Modular orientada a Domínio**.

---

# Tecnologias

* Java
* Spring Boot
* Spring Security
* Keycloak
* Spring Data JPA
* PostgreSQL
* Docker

---

# Arquitetura

O backend segue o padrão **Modular Monolith**, onde o sistema é dividido em módulos de domínio independentes.

Estrutura principal:

```
src/main/java/com/plataforma

config/
shared/
modules/

modules/
 ├── projeto
 ├── requisito
 ├── usuario
 └── auditoria
```

Cada módulo possui sua própria separação em camadas:

* Controller
* Service
* Domain
* Repository
* DTO

---

# Configuração

As configurações da aplicação estão no arquivo:

```
src/main/resources/application.yml
```

---

# Executar a aplicação localmente

O backend é executado através do ambiente Docker definido na pasta **infrastructure**.

Para executar todo o sistema:

```
docker compose up
```

Caso queira rodar apenas o backend localmente:

```
./mvnw spring-boot:run
```

---

# Porta padrão

| Serviço     | Porta |
| ----------- | ----- |
| Backend API | 8080  |

---

# Segurança

A autenticação e autorização são realizadas utilizando:

* Keycloak (Identity Provider)
* JWT
* Spring Security

O controle de acesso segue o modelo **RBAC (Role Based Access Control)**.

---

# Licença

Este módulo faz parte da **Plataforma de Governança de Projetos de Software** e está protegido pela licença proprietária definida no repositório principal.
