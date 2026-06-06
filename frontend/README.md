# Frontend — Plataforma de Governança de Projetos de Software

## Descrição

Este módulo contém a **interface web** da Plataforma de Governança de Projetos de Software.

A aplicação fornece uma interface para que gestores, desenvolvedores e stakeholders possam:

- gerenciar projetos  
- cadastrar e acompanhar requisitos  
- visualizar artefatos do projeto  
- registrar eventos e atividades  
- acompanhar indicadores do projeto  

O frontend se comunica com a API backend por meio de **requisições HTTP REST**.

---

## Tecnologias

Este projeto foi desenvolvido utilizando:

- React
- TypeScript
- Vite
- ESLint
- Docker

### Plugins utilizados

- @vitejs/plugin-react (Babel ou OXC) ou
- @vitejs/plugin-react-swc (SWC para Fast Refresh)

---

## Estrutura do Projeto

Estrutura principal do código:

src/
  components/
  pages/
  services/
  hooks/
  contexts/
  routes/
  utils/

### Descrição das pastas

| Pasta      | Descrição                      |
|------------|--------------------------------|
| components | Componentes reutilizáveis      |
| pages      | Páginas da aplicação           |
| services   | Comunicação com APIs           |
| hooks      | Hooks customizados             |
| contexts   | Gerenciamento de estado global |
| routes     | Configuração de rotas          |
| utils      | Funções utilitárias            |

---

## Configuração

As variáveis de ambiente devem ser definidas no arquivo:

.env

Exemplo:

VITE_API_URL=http://localhost:8080

---

## Executar o projeto

Para executar em ambiente de desenvolvimento:

npm install
npm run dev

A aplicação estará disponível em:

http://localhost:3000

---

## Build para produção

Para gerar a build do projeto:

npm run build

Para visualizar a build:

npm run preview

---

## Qualidade de código (ESLint)

O projeto utiliza ESLint configurado para TypeScript.

Para aplicações em produção, recomenda-se habilitar regras mais rigorosas com verificação de tipos:

- recommendedTypeChecked
- strictTypeChecked
- stylisticTypeChecked

Também é possível utilizar plugins adicionais:

- eslint-plugin-react-x
- eslint-plugin-react-dom

---

## Executar com Docker

O frontend pode ser executado via Docker Compose (definido na pasta infrastructure):

docker compose up

---

## Integração com Backend

O frontend consome a API do backend utilizando requisições REST.

### Principais funcionalidades integradas:

- autenticação via Keycloak  
- gerenciamento de projetos  
- gestão de requisitos  
- upload e visualização de documentos  

---

## Licença

Este módulo faz parte da **Plataforma de Governança de Projetos de Software** e está protegido pela licença proprietária definida no repositório principal.
