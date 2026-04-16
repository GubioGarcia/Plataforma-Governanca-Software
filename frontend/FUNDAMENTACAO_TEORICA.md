# Fundamentação Teórica — Plataforma Discovery

---

## 1. Engenharia de Requisitos

### 1.1 Definição e Importância

A Engenharia de Requisitos (ER) é uma disciplina da Engenharia de Software que trata do processo sistemático de identificação, análise, documentação, validação e gestão dos requisitos de um sistema de software. Sommerville (2011) define requisitos como as descrições dos serviços que um sistema deve fornecer e das restrições sob as quais ele deve operar. Esses requisitos refletem as necessidades dos clientes em relação ao sistema que será desenvolvido.

A importância da ER é reconhecida como crítica: estudos históricos, como o Chaos Report do Standish Group, apontam que falhas na especificação de requisitos estão entre as principais causas de insucesso em projetos de software — seja por entregas fora do prazo, estouros de orçamento ou sistemas que não atendem às necessidades reais dos usuários finais (Standish Group, 2020). Pressman (2014) reforça que o custo de corrigir um erro de requisito identificado na fase de testes pode ser até 200 vezes maior do que se identificado durante a própria fase de levantamento.

### 1.2 Tipos de Requisitos

Os requisitos de software são classicamente classificados em dois grandes grupos:

**Requisitos Funcionais (RF):** Descrevem as funções e comportamentos que o sistema deve executar. Definem o que o sistema faz — as funcionalidades que os usuários podem interagir diretamente. Exemplos: "o sistema deve permitir cadastrar um requisito", "o sistema deve exibir o histórico de auditoria".

**Requisitos Não Funcionais (RNF):** Descrevem restrições, qualidades e atributos de qualidade do sistema — como ele se comporta, e não apenas o que faz. São subdivididos em categorias como desempenho, segurança, usabilidade, confiabilidade e portabilidade (ISO/IEC 25010, 2011). Exemplos: "o sistema deve autenticar o usuário em menos de 2 segundos", "todas as requisições devem ser protegidas por HTTPS".

### 1.3 Elicitação de Requisitos

A elicitação de requisitos é a fase inicial do processo de ER e consiste em descobrir, identificar e compreender as necessidades dos stakeholders. Segundo Wiegers e Beatty (2013), é considerada uma das atividades mais complexas da engenharia de software, pois envolve comunicação entre pessoas com diferentes perspectivas, conhecimentos técnicos e interesses.

As principais técnicas de elicitação incluem:

- **Entrevistas:** Sessões diretas com stakeholders para coleta de necessidades;
- **Workshops de Requisitos (JAD):** Reuniões estruturadas com múltiplos envolvidos para elicitação colaborativa;
- **Prototipação:** Criação de protótipos interativos para validação junto ao cliente;
- **Análise de Documentos:** Revisão de documentação existente na organização;
- **Observação (Etnografia):** Estudo do ambiente onde o sistema será utilizado.

### 1.4 Fluxo de Vida de um Requisito

O ciclo de vida de um requisito descreve os estados pelos quais ele transita, desde sua concepção até sua validação final. Modelos como o proposto por Hull, Jackson e Dick (2011) definem fluxos típicos:

```
RASCUNHO → EM_ANÁLISE → EM_VALIDAÇÃO → APROVADO → VALIDADO
```

Este modelo está diretamente implementado na Plataforma Discovery, onde cada requisito percorre esse funil sob supervisão dos papéis responsáveis (Analista, Stakeholder e Gestor), garantindo rastreabilidade completa de todas as transições de estado.

---

## 2. O Processo de Discovery em Projetos de Software

### 2.1 Conceito de Discovery

O processo de **Discovery** (ou fase de descoberta) é uma etapa estratégica que precede o início do desenvolvimento de software. Tem como objetivo compreender profundamente o problema a ser resolvido, o público-alvo, os requisitos de negócio e as restrições técnicas, antes que qualquer linha de código seja escrita (Patton, 2014).

Na prática de mercado, especialmente em contextos de desenvolvimento ágil, o Discovery é reconhecido por metodologias como o **Design Thinking**, o **Lean UX** e o **Dual-Track Agile** como uma fase contínua e paralela ao desenvolvimento, garantindo que o produto a ser construído realmente entregue valor.

### 2.2 Principais Atividades do Discovery

De acordo com Gothelf e Seiden (2021), as atividades centrais do Discovery incluem:

1. **Definição do problema** — compreender o contexto e o problema real a ser resolvido;
2. **Mapeamento de stakeholders** — identificar todos os envolvidos e suas expectativas;
3. **Levantamento de requisitos** — elicitar e documentar as necessidades;
4. **Validação de hipóteses** — confirmar com os stakeholders se as interpretações estão corretas;
5. **Documentação estruturada** — registrar formalmente as decisões tomadas;
6. **Priorização** — ordenar os requisitos por valor de negócio e viabilidade técnica.

### 2.3 Desafios do Discovery

Sem ferramentas adequadas de suporte, o processo de discovery sofre com problemas recorrentes: informações dispersas em e-mails e planilhas, falta de rastreabilidade das decisões, dificuldade de engajamento dos stakeholders e ausência de histórico das mudanças. A Plataforma Discovery foi concebida exatamente para centralizar e estruturar esse processo em uma única ferramenta colaborativa.

---

## 3. Gestão de Stakeholders

### 3.1 Definição

O termo **stakeholder** foi formalmente introduzido na literatura de gestão por Freeman (1984) para descrever qualquer indivíduo ou grupo que pode afetar ou ser afetado pelos objetivos de uma organização. No contexto de projetos de software, o PMI (Project Management Institute, 2021) define stakeholders como "indivíduos, grupos ou organizações que podem afetar, ser afetados ou perceber-se afetados por uma decisão, atividade ou resultado de um projeto".

### 3.2 Classificação dos Stakeholders

A literatura apresenta diversas formas de classificar stakeholders. O modelo de Saliência de Mitchell, Agle e Wood (1997) categoriza stakeholders segundo três atributos: **poder** (capacidade de influência), **legitimidade** (validade da relação com o projeto) e **urgência** (criticidade temporal de suas demandas). A interseção desses atributos determina o nível de prioridade de cada parte interessada.

No contexto específico da Plataforma Discovery, os stakeholders são classificados por **papéis operacionais** que determinam suas permissões no sistema:

| Papel | Responsabilidade Principal |
|---|---|
| Gestor | Visão completa, validações finais e gestão da equipe |
| Analista | Criação e edição de conteúdo técnico |
| Stakeholder | Revisão e aprovação de requisitos e documentação |
| Desenvolvedor | Consulta e leitura do material produzido |

### 3.3 Engajamento de Stakeholders

O engajamento efetivo dos stakeholders é um fator crítico de sucesso em projetos (PMI, 2021). Segundo Sommerville (2011), problemas de comunicação entre equipes de desenvolvimento e partes interessadas são responsáveis por uma parcela significativa dos requisitos mal definidos ou incompletos. Ferramentas que facilitem a participação ativa dos stakeholders no fluxo de aprovação de requisitos contribuem diretamente para a qualidade do produto final.

---

## 4. Controle de Acesso Baseado em Papéis (RBAC)

### 4.1 Fundamentos do RBAC

O **Role-Based Access Control (RBAC)** é um modelo de controle de acesso proposto por Sandhu et al. (1996) no qual as permissões são associadas a papéis (roles), e os usuários recebem permissões ao serem atribuídos a esses papéis, em vez de receber permissões diretamente. Esse modelo simplifica enormemente a administração de segurança em sistemas com múltiplos usuários e perfis distintos.

O padrão RBAC é formalizado pelo NIST (National Institute of Standards and Technology) em quatro níveis progressivos:

- **RBAC0 (Core RBAC):** Usuários, papéis e permissões básicas;
- **RBAC1 (Hierárquico):** Herança de papéis (um papel superior herda permissões dos inferiores);
- **RBAC2 (Com Restrições):** Separação de deveres e restrições de cardinalidade;
- **RBAC3 (Consolidado):** Combinação dos níveis 1 e 2.

### 4.2 RBAC na Plataforma Discovery

A Plataforma Discovery implementa o modelo **RBAC0** com elementos hierárquicos implícitos. As permissões são controladas pelo hook customizado `usePermissions`, que verifica o papel do usuário autenticado e libera ou restringe funcionalidades da interface (edição, aprovação, validação, gerenciamento de membros). Esse padrão é amplamente adotado na indústria por sua clareza, auditabilidade e facilidade de manutenção.

---

## 5. Autenticação e Autorização com OAuth2 e OpenID Connect

### 5.1 OAuth 2.0

O **OAuth 2.0** (RFC 6749) é um protocolo de autorização aberto que permite que aplicações de terceiros obtenham acesso limitado a serviços web em nome de um usuário, sem expor suas credenciais. Publicado pelo IETF em 2012, tornou-se o padrão de facto para autorização em APIs modernas (Hardt, 2012).

O fluxo mais comum para aplicações web é o **Authorization Code Flow**, onde a aplicação redireciona o usuário para o servidor de autorização, que emite um código trocado posteriormente por um token de acesso.

### 5.2 OpenID Connect (OIDC)

O **OpenID Connect** é uma camada de identidade construída sobre o OAuth 2.0 (Sakimura et al., 2014). Enquanto o OAuth 2.0 lida com autorização (o que o usuário pode fazer), o OIDC lida com autenticação (quem é o usuário). O OIDC introduz o **ID Token** — um JSON Web Token (JWT) que contém informações sobre a identidade do usuário autenticado.

### 5.3 Keycloak

O **Keycloak** é uma solução open-source de Identity and Access Management (IAM) desenvolvida pela Red Hat. Fornece Single Sign-On (SSO), gerenciamento de usuários, suporte nativo ao OAuth 2.0 e OpenID Connect, além de federação de identidades com provedores externos (Red Hat, 2023).

Na Plataforma Discovery, o Keycloak é utilizado como servidor de autenticação central. A integração é realizada através das bibliotecas `keycloak-js` e `@react-keycloak/web`, configuradas em `src/config/keycloak.ts`. Para o ambiente de demonstração do TCC, o fluxo de autenticação é simulado localmente por meio de mocks, mantendo a mesma interface de contratos que seria utilizada em produção.

---

## 6. Aplicações Web Single-Page (SPA)

### 6.1 Evolução das Aplicações Web

As aplicações web evoluíram de documentos HTML estáticos para sistemas interativos complexos. O modelo tradicional de **Multi-Page Application (MPA)** recarregava a página inteira a cada interação. As **Single-Page Applications (SPAs)** representam uma mudança de paradigma: ao carregar apenas um único documento HTML e atualizar o conteúdo dinamicamente via JavaScript, oferecem uma experiência de usuário mais fluida e responsiva, similar a aplicações nativas (Fink e Flatow, 2014).

### 6.2 Roteamento Client-Side

Em uma SPA, o roteamento é gerenciado pelo navegador, sem requisições ao servidor para cada mudança de página. O **React Router DOM** implementa esse conceito por meio da History API do navegador, permitindo URLs amigáveis e navegação sem recarregamento. Rotas protegidas — como as implementadas no componente `ProtectedRoute` — verificam o estado de autenticação antes de renderizar o conteúdo solicitado, redirecionando usuários não autenticados para a página de login.

---

## 7. React e o Paradigma de Componentes

### 7.1 Histórico e Filosofia

O **React** é uma biblioteca JavaScript para construção de interfaces de usuário, criada pelo Facebook (atualmente Meta) em 2013 e lançada como open-source. Seu principal diferencial é o modelo de programação baseado em **componentes reutilizáveis** e o conceito de **Virtual DOM**, que otimiza as atualizações da interface ao calcular as diferenças entre o estado anterior e o novo da árvore de componentes, aplicando apenas as mudanças necessárias ao DOM real (Facebook, 2013).

### 7.2 Hooks

Introduzidos na versão 16.8 (2019), os **React Hooks** permitem o uso de estado e outros recursos do React em componentes funcionais, eliminando a necessidade de classes. Os hooks mais relevantes neste projeto incluem:

- `useState` — gerenciamento de estado local;
- `useEffect` — efeitos colaterais e ciclo de vida;
- `useContext` — consumo de contextos globais (AuthContext, SnackbarContext);
- `useParams` / `useNavigate` — integração com o roteamento.

### 7.3 Context API

A **Context API** do React permite compartilhar dados entre componentes sem a necessidade de prop drilling (passagem manual de propriedades por múltiplos níveis da árvore). Na Plataforma Discovery, três contextos globais são utilizados: `AuthContext` (usuário e papel), `SnackbarContext` (notificações toast) e `ThemeContext` (tema claro/escuro).

---

## 8. TypeScript no Desenvolvimento Front-End

O **TypeScript** é um superset tipado do JavaScript desenvolvido pela Microsoft (Anders Hejlsberg, 2012). Adiciona uma camada de tipagem estática opcional que é verificada em tempo de compilação, sem impacto no código JavaScript gerado para produção.

Os principais benefícios do TypeScript em projetos de médio e grande porte incluem:

- **Detecção de erros em tempo de desenvolvimento:** o compilador identifica incompatibilidades de tipos antes da execução;
- **Autodocumentação:** interfaces e tipos servem como contratos explícitos entre módulos;
- **Refatoração segura:** ferramentas de IDE (como o VS Code com Pylance/TypeScript Language Server) oferecem renomeação, busca de referências e autocompletar com total segurança de tipos;
- **Manutenibilidade:** equipes maiores se beneficiam da clareza trazida pelos tipos, reduzindo ambiguidades.

Na Plataforma Discovery, todos os módulos são tipados com interfaces definidas na pasta `src/types/`, garantindo contratos consistentes entre os dados mockados, os componentes e os serviços de API.

---

## 9. Material Design e Sistemas de Design

### 9.1 Material Design

O **Material Design** é uma linguagem de design criada pelo Google em 2014, que define princípios visuais, de comportamento e de interação para interfaces digitais. Baseado em metáforas do mundo físico (superfícies, sombras, elevação), propõe um vocabulário visual consistente e acessível, aplicável em plataformas web e mobile (Google, 2014).

### 9.2 Material UI (MUI)

O **Material UI (MUI)** é a implementação de referência do Material Design para aplicações React. Oferece uma biblioteca extensa de componentes prontos, acessíveis e customizáveis — botões, tabelas, modais, chips, avatares, entre outros — que seguem as diretrizes do Material Design. Seu sistema de tema permite personalização profunda: cores, tipografia, espaçamentos e suporte nativo a modos claro e escuro (MUI, 2023).

A adoção do MUI neste projeto elimina a necessidade de construir componentes do zero, permitindo foco no desenvolvimento das regras de negócio e das funcionalidades específicas da plataforma.

---

## 10. Gestão de Estado e Dados Assíncronos

### 10.1 Server State vs. Client State

Uma distinção fundamental na arquitetura de aplicações React modernas é a separação entre **estado do cliente** (dados temporários e locais, como estado de formulários e modais) e **estado do servidor** (dados que originam-se da API e precisam ser sincronizados, cacheados e revalidados). Ferramentas como o **TanStack Query (React Query)** foram criadas especificamente para gerenciar o ciclo de vida do estado do servidor: busca, cache, sincronização em segundo plano e tratamento de erros (Tannerlinsley, 2021).

### 10.2 Validação de Formulários com Zod e React Hook Form

O **React Hook Form** é uma solução de alta performance para gerenciamento de formulários que minimiza re-renders ao trabalhar com referências não controladas (uncontrolled inputs). Associado ao **Zod** — uma biblioteca de validação de schemas com inferência automática de tipos TypeScript (Colinhacks, 2020) — forma um padrão robusto para validação de dados de entrada com total segurança de tipos (type-safe validation).

---

## 11. Rastreabilidade e Auditoria em Sistemas de Software

### 11.1 Rastreabilidade de Requisitos

A rastreabilidade de requisitos é a capacidade de acompanhar um requisito ao longo de todo o ciclo de vida do desenvolvimento, desde sua origem até sua implementação e validação. Gotel e Finkelstein (1994) definem rastreabilidade como a "capacidade de descrever e acompanhar a vida de um requisito tanto para frente quanto para trás".

A rastreabilidade é dividida em:

- **Pre-RS (pré-Requisito de Sistema):** rastreia a origem do requisito (quem solicitou, por quê);
- **Post-RS (pós-Requisito de Sistema):** rastreia como o requisito foi implementado, testado e validado.

### 11.2 Logs de Auditoria

Em sistemas corporativos, os **logs de auditoria** (audit trails) são registros imutáveis de todas as ações realizadas por usuários no sistema — quem realizou a ação, o que foi alterado, em qual entidade, e quando. Além do valor de conformidade (compliance) com regulações como LGPD e ISO 27001, os logs de auditoria são ferramentas essenciais de governança, permitindo investigação de incidentes e rastreabilidade de decisões (ISACA, 2019).

Na Plataforma Discovery, o módulo de **Auditoria** registra todas as operações relevantes do sistema, com acesso restrito a Gestores e Analistas, garantindo tanto a rastreabilidade das decisões quanto a privacidade e integridade dos dados.

---

## 12. Arquitetura de Software Front-End

### 12.1 Arquitetura Baseada em Funcionalidades (Feature-Sliced)

A organização do código por domínios de negócio — em vez de por tipo técnico (controllers, views, models no mesmo diretório) — é uma prática amplamente recomendada para projetos front-end de médio e grande porte (Slobodkin, 2021). Essa abordagem, conhecida como **Feature-Sliced Design** ou organização por módulos de funcionalidade, agrupa em uma mesma pasta todos os artefatos relacionados a um domínio (componentes, hooks, tipos, serviços), o que reduz o acoplamento entre módulos e melhora a coesão interna de cada feature.

A Plataforma Discovery adota esse padrão na pasta `src/features/`, onde cada subdiretório representa um domínio isolado da aplicação (requirements, wiki, stakeholders, etc.).

### 12.2 Vite como Ferramenta de Build

O **Vite** é uma ferramenta de build de nova geração para projetos web, criada por Evan You (também criador do Vue.js). Sua principal inovação é servir os módulos diretamente via **ES Modules nativos do navegador** durante o desenvolvimento, eliminando o passo de empacotamento (bundling) e tornando os tempos de inicialização praticamente instantâneos, independentemente do tamanho do projeto. Para produção, utiliza o **Rollup** como bundler, gerando saídas otimizadas com tree-shaking e code splitting automáticos (You, 2021).

---

## 13. Qualidade de Software

### 13.1 Modelos de Qualidade

A qualidade de software é definida pela norma **ISO/IEC 25010:2011** (SQuaRE — System and Software Quality Requirements and Evaluation) como o grau em que um produto de software satisfaz requisitos explícitos e implícitos quando utilizado sob condições especificadas. O modelo define oito características de qualidade principais: adequação funcional, desempenho, compatibilidade, usabilidade, confiabilidade, segurança, manutenibilidade e portabilidade.

### 13.2 Qualidade no Código Front-End

No contexto front-end, ferramentas de análise estática como o **ESLint** contribuem diretamente para a manutenibilidade e confiabilidade do código. Ao definir e impor regras de estilo e boas práticas (como o uso correto dos hooks React ou o cumprimento das convenções TypeScript), o ESLint automatiza parte da revisão de código e previne a introdução de bugs conhecidos.

---

## Referências

- HARDT, D. **The OAuth 2.0 Authorization Framework**. RFC 6749, IETF, 2012.
- FREEMAN, R. E. **Strategic Management: A Stakeholder Approach**. Pitman, 1984.
- GOTHELF, J.; SEIDEN, J. **Lean UX: Designing Great Products with Agile Teams**. 3. ed. O'Reilly Media, 2021.
- GOTEL, O. C. Z.; FINKELSTEIN, A. C. W. An analysis of the requirements traceability problem. In: **Proceedings of the 1st IEEE International Conference on Requirements Engineering**, 1994.
- GOOGLE. **Material Design Guidelines**. Disponível em: https://m3.material.io. 2014.
- HULL, E.; JACKSON, K.; DICK, J. **Requirements Engineering**. 3. ed. Springer, 2011.
- ISACA. **COBIT 2019 Framework**. ISACA, 2019.
- ISO/IEC 25010:2011. **Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE)**. ISO, 2011.
- MITCHELL, R. K.; AGLE, B. R.; WOOD, D. J. Toward a theory of stakeholder identification and salience. **Academy of Management Review**, v. 22, n. 4, p. 853–886, 1997.
- MUI. **Material UI Documentation**. Disponível em: https://mui.com. 2023.
- NIST. **Role Based Access Control**. NIST Special Publication 800-162, 2014.
- PATTON, J. **User Story Mapping: Discover the Whole Story, Build the Right Product**. O'Reilly Media, 2014.
- PMI. **A Guide to the Project Management Body of Knowledge (PMBOK Guide)**. 7. ed. Project Management Institute, 2021.
- PRESSMAN, R. S. **Engenharia de Software: Uma Abordagem Profissional**. 8. ed. McGraw-Hill, 2014.
- RED HAT. **Keycloak Documentation**. Disponível em: https://www.keycloak.org/documentation. 2023.
- SAKIMURA, N. et al. **OpenID Connect Core 1.0**. OpenID Foundation, 2014.
- SANDHU, R. S. et al. Role-based access control models. **IEEE Computer**, v. 29, n. 2, p. 38–47, 1996.
- SOMMERVILLE, I. **Engenharia de Software**. 9. ed. Pearson, 2011.
- STANDISH GROUP. **Chaos Report 2020**. The Standish Group International, 2020.
- WIEGERS, K.; BEATTY, J. **Software Requirements**. 3. ed. Microsoft Press, 2013.
- YOU, E. **Vite Documentation**. Disponível em: https://vitejs.dev. 2021.
