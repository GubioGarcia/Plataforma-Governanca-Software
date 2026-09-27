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

## Testes ponta a ponta da interface (Playwright)

A pasta `e2e/` testa a interface num navegador real (Chromium) contra o ambiente Docker, cobrindo as regras de autorização: sessão, organização e membros, o que cada papel vê dentro do projeto, solicitações, convites, participantes e perfil.

Cada arquivo de teste cria pela API um cenário descartável (organização, dois projetos e as pessoas Dono, Gestor, Membro, convidado e estranho) e apaga tudo no fim (Keycloak e banco). Por isso os arquivos rodam em paralelo e não mexem nos dados da demo.

Pré-requisitos: ambiente no ar (`docker compose up -d` em `infrastructure/`) e o navegador instalado uma vez:

```bash
npx playwright install chromium
```

Executar:

```bash
npm run test:e2e          # todos, sem janela
npx playwright test --headed          # vendo o navegador
npm run test:e2e:ui       # modo interativo
npx playwright show-report e2e-report # relatório (com trace e captura das falhas)
```

Variáveis de ambiente opcionais: `E2E_BASE_URL` (padrão `http://localhost`), `E2E_API_URL`, `E2E_KEYCLOAK_URL`, `E2E_KC_ADMIN_USER`/`E2E_KC_ADMIN_PASS`, `E2E_PG_CONTAINER`.

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
