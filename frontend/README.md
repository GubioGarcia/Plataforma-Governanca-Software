# Frontend — Plataforma de Governança de Projetos de Software

## Descrição

Este módulo contém a **interface web** da Plataforma de Governança de Projetos de Software.

A aplicação fornece uma interface para que gestores, desenvolvedores e stakeholders possam:

* gerenciar projetos
* cadastrar e acompanhar requisitos
* visualizar artefatos do projeto
* registrar eventos e atividades
* acompanhar indicadores do projeto

O frontend se comunica com a API backend por meio de **requisições HTTP REST**.

---

# Tecnologias

* Pendente definição
* Docker

---

# Estrutura do Projeto

Estrutura principal do código:

```
src/

components/
pages/
services/
hooks/
contexts/
routes/
utils/
```

Descrição das pastas:

| Pasta      | Descrição                      |
| ---------- | ------------------------------ |
| components | Componentes reutilizáveis      |
| pages      | Páginas da aplicação           |
| services   | Comunicação com APIs           |
| hooks      | Hooks customizados             |
| contexts   | Gerenciamento de estado global |
| routes     | Configuração de rotas          |
| utils      | Funções utilitárias            |

---

# Configuração

Variáveis de ambiente devem ser definidas em:

```
.env
```

Exemplo:

```
VITE_API_URL=http://localhost:8080
```

---

# Executar o projeto

Para executar localmente em modo desenvolvimento:

```
Comandos para execução
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

# Executar com Docker

O frontend também pode ser executado através do Docker Compose definido na pasta **infrastructure**:

```
docker compose up
```

---

# Integração com Backend

O frontend consome a API do backend utilizando requisições REST.

Principais funcionalidades integradas:

* autenticação via Keycloak
* gerenciamento de projetos
* gestão de requisitos
* upload e visualização de documentos

---

# Licença

Este módulo faz parte da **Plataforma de Governança de Projetos de Software** e está protegido pela licença proprietária definida no repositório principal.
