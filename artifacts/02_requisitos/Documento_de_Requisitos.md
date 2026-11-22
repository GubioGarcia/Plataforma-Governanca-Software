# Documento de Requisitos — Discovery Platform

| Campo | Valor |
|---|---|
| Versão | 2.0 |
| Data | 22/11/2026 |
| Escopo | 27 requisitos funcionais (RF01–RF27) e 16 requisitos não funcionais (RNF01–RNF16) |
| Base | Especificação de requisitos da monografia (seção “Especificação de requisitos”), conferida com o código do repositório no commit `361517c` (02/11/2026) |
| Documentos relacionados | [MER](../01_modelagem-de-dados/MER_V4.txt), [DER](../01_modelagem-de-dados/DER_V5.png), [Matriz de rastreabilidade](../03_matrizes/Matriz_Rastreabilidade.xlsx), [Matriz de risco](../03_matrizes/Matriz_Risco.xlsx) |

## Histórico de versões

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | Abril de 2026 | Lista inicial com 15 requisitos funcionais e 12 não funcionais (planejamento do TCC). |
| 2.0 | Novembro de 2026 | Versão atual, alinhada à implementação: convites, solicitações dos stakeholders, modelagem de dados, impacto nos dados, matriz de rastreabilidade, arquivos, indicadores, exportação em CSV, área administrativa, página pública e política de privacidade, pesquisa de avaliação e seu painel; requisitos não funcionais de limite de requisições, cabeçalhos de segurança, privacidade e versionamento do esquema; RNF11 passa de “backup” para persistência em volumes. |

## 1. Introdução

A especificação de requisitos define as funcionalidades esperadas do sistema e os critérios de qualidade necessários para seu funcionamento adequado. Esses requisitos foram identificados a partir da análise das necessidades de gestão das fases de discovery e elicitação de requisitos em projetos de software. Os requisitos funcionais descrevem as operações e os serviços que o sistema deverá fornecer aos usuários, e os requisitos não funcionais definem atributos de qualidade e restrições técnicas.

### Papéis

- **Organização:** Dono, Gestor e Membro. Os papéis da organização são herdados pelos projetos.
- **Projeto:** Dono, Gestor, Stakeholder Técnico e Stakeholder Cliente.
- **Admin da Plataforma:** conta exclusiva, criada apenas por script no servidor, com acesso somente à área administrativa e sem acesso ao conteúdo dos projetos.

## 2. Requisitos funcionais

### RF01 — Cadastro de organizações

O sistema deverá permitir o cadastro de organizações contendo informações básicas como nome, descrição e plano. Cada organização possui um único Dono, atribuído ao usuário que a criou, e pode possuir múltiplos usuários vinculados com os papéis de Gestor ou Membro.

### RF02 — Cadastro de usuários e administração de contas

O sistema deverá permitir que cada pessoa crie sua própria conta, informando nome, e-mail e senha, ou ingresse na plataforma a partir de um convite recebido por e-mail. Cada usuário poderá editar apenas os próprios dados, e o Admin da Plataforma poderá, na área administrativa, listar e pesquisar as contas existentes, consultar os acessos de cada usuário e inativar contas, exceto a própria, sem editar os dados de outras pessoas.

### RF03 — Papéis organizacionais

O sistema deverá atribuir aos usuários de uma organização um dos papéis fixos Dono, Gestor ou Membro, cujas permissões são definidas pela matriz de permissões do sistema. O Dono e os Gestores poderão promover Membros a Gestores, e somente o Dono poderá remover usuários da organização.

### RF04 — Cadastro de projetos

O sistema deverá permitir o cadastro de projetos contendo nome, descrição, organização associada e status do projeto. O usuário que cria o projeto torna-se o seu Dono.

### RF05 — Gestão de participantes do projeto

O sistema deverá permitir associar usuários a projetos com os papéis de Dono, Gestor, Stakeholder Técnico ou Stakeholder Cliente, possibilitando a participação de diferentes stakeholders. Os papéis da organização deverão ser herdados pelos projetos, e novos participantes poderão ser incluídos por meio de convites enviados por e-mail.

### RF06 — Registro da visão do produto

O sistema deverá permitir registrar a visão do produto contendo informações como problema a ser resolvido, público-alvo, objetivo geral, objetivos específicos, indicadores de sucesso (KPIs) e restrições do projeto, divididas em prazo, orçamento, tecnologias obrigatórias e regulamentações.

### RF07 — Cadastro de requisitos

O sistema deverá permitir o cadastro de requisitos vinculados a um projeto, contendo código sequencial no formato REQ-NNN, título, descrição, tipo de requisito, prioridade (baixa, média, alta ou crítica), versão, status e critérios de aceite.

### RF08 — Discussão de requisitos

O sistema deverá permitir que os participantes do projeto adicionem comentários e participem de discussões vinculadas aos requisitos registrados.

### RF09 — Aprovação de requisitos

O sistema deverá permitir que o Dono ou o Gestor do projeto aprove ou reprove formalmente os requisitos registrados, registrando o responsável e a data da decisão. Os stakeholders participam desse processo por meio das solicitações descritas no RF17.

### RF10 — Controle de status de requisitos

O sistema deverá permitir alterar o status de um requisito entre os estados rascunho, em revisão, aprovado, reprovado e arquivado, sendo os estados aprovado e reprovado atribuídos exclusivamente por meio da aprovação formal.

### RF11 — Registro de eventos do projeto

O sistema deverá permitir o registro de eventos relacionados ao projeto, como reuniões, workshops de discovery e entregas de artefatos, contendo nome, descrição e datas de início e término. Eventos criados pelo Dono ou Gestor são registrados como aprovados, enquanto eventos pedidos por stakeholders são registrados com o status solicitado até a decisão do gestor.

### RF12 — Auditoria de alterações

O sistema deverá registrar automaticamente o histórico de alterações realizadas nas entidades do sistema, incluindo usuário responsável, data e valores alterados. As ações realizadas na área administrativa e na gestão da pesquisa de avaliação também deverão ser registradas, sem vínculo com organização ou projeto.

### RF13 — Controle de permissões

O sistema deverá controlar o acesso às funcionalidades com base nos papéis do usuário na organização e no projeto, mantidos em grupos do Keycloak, e em uma matriz fixa que associa cada papel às suas permissões. Os tokens de acesso de um usuário deverão ser revogados sempre que os seus papéis forem alterados.

### RF14 — Controle de versão de requisitos

O sistema deverá controlar a versão dos requisitos cadastrados, incrementando o número da versão a cada edição realizada. O histórico das alterações deverá ser mantido por meio da auditoria, que registra, para cada campo alterado, o valor anterior e o novo valor.

### RF15 — Visualização do status dos requisitos

O sistema deverá permitir que os usuários acompanhem o status atual dos requisitos do projeto e sua evolução ao longo do processo de elicitação e validação.

### RF16 — Convites para organizações e projetos

O sistema deverá permitir que usuários com permissão convidem pessoas por e-mail para uma organização, com o papel de Gestor ou Membro, ou para um projeto, com o papel de Gestor ou de Stakeholder. O convite deverá ter validade de sete dias e poderá ser aceito, recusado ou cancelado; quem ainda não possui conta poderá se cadastrar com o mesmo e-mail e aceitar o convite ao entrar na plataforma.

### RF17 — Solicitações dos stakeholders

O sistema deverá permitir que os stakeholders façam solicitações formais ao Dono ou Gestor do projeto, acompanhadas de justificativa. Os stakeholders poderão solicitar a alteração ou a reprovação de requisitos aprovados, a criação de eventos e a exportação da modelagem de dados ou da matriz de rastreabilidade, e o Stakeholder Cliente poderá, adicionalmente, solicitar a aprovação de requisitos. O Dono ou Gestor poderá atender ou recusar cada solicitação, registrando uma resposta ao solicitante.

### RF18 — Modelagem de dados do projeto

O sistema deverá permitir o cadastro das entidades de dados do produto especificado no projeto, com seus atributos, tipos, obrigatoriedade, chave primária e chaves estrangeiras. Os relacionamentos entre entidades, com sua cardinalidade, deverão ser criados a partir dos atributos de chave estrangeira, e o sistema deverá apresentar o diagrama entidade-relacionamento correspondente.

### RF19 — Impacto de requisitos nos dados

O sistema deverá permitir registrar o impacto de um requisito sobre as entidades e atributos da modelagem de dados, indicando o tipo de operação (criação, alteração ou remoção) e os valores anteriores e posteriores à mudança, e exibir, para cada entidade, os requisitos que a manipulam.

### RF20 — Matriz de rastreabilidade

O sistema deverá permitir registrar vínculos diretos entre requisitos, dos tipos depende de, impacta, duplica e conflita, e apresentar uma matriz de rastreabilidade que contemple esses vínculos e as relações indiretas, derivadas de requisitos que impactam as mesmas entidades de dados.

### RF21 — Gestão de arquivos do projeto

O sistema deverá permitir o envio, a listagem, o download e a exclusão de arquivos e artefatos vinculados ao projeto, com tamanho máximo de 20 MB por arquivo.

### RF22 — Indicadores de engajamento

O sistema deverá registrar as interações dos participantes nos módulos do projeto e apresentar indicadores consolidados, como a distribuição dos requisitos por status e por tipo, a taxa de aprovação e o engajamento de cada stakeholder.

### RF23 — Exportação em CSV

O sistema deverá permitir a exportação da modelagem de dados e da matriz de rastreabilidade em formato CSV. O Dono e o Gestor poderão exportar diretamente, enquanto os stakeholders deverão realizar uma solicitação, sendo o download liberado após o seu atendimento. Os arquivos gerados deverão neutralizar conteúdos que possam ser interpretados como fórmulas por programas de planilha.

### RF24 — Página pública e política de privacidade

O sistema deverá disponibilizar uma página pública de apresentação do produto, com acesso às telas de login e de criação de conta, e uma página com a política de privacidade, descrevendo os dados coletados, a sua finalidade, quem tem acesso a eles e como solicitar a exclusão. A página pública não deverá realizar chamadas à API nem utilizar rastreadores ou scripts de terceiros.

### RF25 — Área administrativa

O sistema deverá disponibilizar ao Admin da Plataforma uma área administrativa com visão geral da plataforma, gestão das contas de usuário, gestão dos dados de referência, auditoria das ações administrativas e painel da pesquisa de avaliação. Os status utilizados pelas regras de negócio não poderão ser renomeados nem excluídos, e nenhuma funcionalidade da interface poderá atribuir o papel de Admin da Plataforma.

### RF26 — Pesquisa de avaliação

O sistema deverá aplicar aos usuários com papel de Dono ou Gestor, enquanto a coleta estiver aberta, um questionário em duas etapas: antes do uso, com termo de consentimento, cinco afirmações em escala de concordância de 1 a 5, uma pergunta aberta e a caracterização do participante; e depois do uso, liberada após um intervalo mínimo, com as mesmas afirmações sobre a plataforma e uma pergunta aberta. Cada etapa poderá ser respondida uma única vez, a primeira etapa registrará se o participante já havia utilizado a plataforma, e o participante poderá retirar a sua participação, o que apagará as suas respostas.

### RF27 — Painel da pesquisa

O sistema deverá permitir ao Admin da Plataforma abrir e encerrar a coleta, definir o intervalo mínimo entre as etapas, consultar as contagens, a distribuição e a mediana de cada item, a comparação pareada entre as etapas, com a opção de desconsiderar os participantes que responderam à primeira etapa após utilizar a plataforma, e as respostas abertas, identificadas apenas pelo código do participante, e exportar as respostas em CSV sem dados de identificação. Os requisitos não funcionais definem atributos de qualidade e restrições técnicas que o sistema deverá atender.

## 3. Requisitos não funcionais

### RNF01 — Autenticação segura

O sistema deverá utilizar autenticação baseada em um servidor de identidade (Keycloak), com detecção de força bruta, que bloqueia temporariamente a conta após tentativas de login malsucedidas, e política de senha com no mínimo oito caracteres e senha diferente do e-mail. As mensagens de erro de login não deverão revelar se a conta existe.

### RNF02 — Controle de acesso

O sistema deverá implementar controle de acesso baseado em papéis (RBAC), com papéis definidos por organização e por projeto e permissões obtidas a partir de uma matriz fixa, garantindo que os usuários acessem apenas funcionalidades permitidas. As permissões deverão ser verificadas no backend, independentemente do que é exibido na interface.

### RNF03 — Desempenho do sistema

O sistema deverá responder às requisições do usuário em até 2 segundos em condições normais de uso. O atendimento a esse critério será verificado por meio dos testes de desempenho planejados no capítulo de testes.

### RNF04 — Rastreabilidade

O sistema deverá manter rastreabilidade entre requisitos, comentários, decisões e histórico de alterações. Essa rastreabilidade é materializada pela matriz de rastreabilidade, que relaciona os requisitos por meio de vínculos diretos e de relações indiretas derivadas do impacto nos dados, pela auditoria das alterações por campo e pelo registro das solicitações e de suas respostas.

### RNF05 — Escalabilidade

A arquitetura do sistema deverá permitir crescimento do número de usuários, projetos e requisitos sem degradação significativa de desempenho.

### RNF06 — Usabilidade

O sistema deverá possuir interface web intuitiva que facilite a navegação e a interação entre os stakeholders.

### RNF07 — Portabilidade

O sistema deverá ser acessível por navegadores modernos como Chrome, Firefox e Edge, sem necessidade de instalação adicional, e possuir interface responsiva, adaptada também ao uso em dispositivos móveis.

### RNF08 — Integridade dos dados

O sistema deverá garantir integridade entre dados relacionados, especialmente entre projetos, requisitos, usuários e comentários.

### RNF09 — Registro de logs

O sistema deverá registrar logs de operações relevantes realizadas pelos usuários, permitindo monitoramento e diagnóstico.

### RNF10 — Consistência transacional

Operações críticas do sistema deverão ser executadas de forma transacional no banco de dados.

### RNF11 — Persistência dos dados

Os dados do sistema deverão ser mantidos em volumes persistentes, separados dos contêineres da aplicação, de modo que as informações do banco de dados e os arquivos enviados aos projetos sejam preservados em reinicializações e atualizações dos serviços.

### RNF12 — Manutenibilidade

O sistema deverá ser desenvolvido seguindo boas práticas de arquitetura e organização de código, permitindo manutenção e evolução com baixo impacto.

### RNF13 — Limite de requisições

O sistema deverá limitar a taxa de requisições por endereço IP, com limites mais restritivos no login, no cadastro e nos envios da pesquisa, respondendo às requisições excedentes com o código HTTP 429.

### RNF14 — Cabeçalhos de segurança

O sistema deverá enviar cabeçalhos de segurança, incluindo a política de segurança de conteúdo, que restringe a execução de scripts aos do próprio domínio, e a proibição de exibição em quadros de outros sites, além de não utilizar scripts, fontes ou ferramentas de análise de terceiros.

### RNF15 — Privacidade e proteção de dados

O sistema deverá coletar apenas os dados necessários às suas finalidades, obter o consentimento do participante antes da pesquisa, identificar as respostas da pesquisa apenas por código nas telas de análise e nas exportações e permitir a retirada da participação, com a eliminação das respostas.

### RNF16 — Versionamento do esquema do banco de dados

A estrutura do banco de dados deverá ser criada e alterada exclusivamente por migrações versionadas, aplicadas automaticamente na inicialização do backend, com a validação do mapeamento das entidades em relação ao esquema.

## 4. Matriz de permissões por papel no projeto

As permissões são obtidas de uma matriz fixa no backend e verificadas a cada requisição (RF13, RNF02).

| Permissão | Dono | Gestor | St. Técnico | St. Cliente |
|---|:-:|:-:|:-:|:-:|
| Visualizar requisitos, WIKI, eventos, arquivos e indicadores | X | X | X | X |
| Comentar requisitos e seções da WIKI | X | X | X | X |
| Criar, editar e excluir requisitos | X | X | – | – |
| Aprovar ou reprovar requisitos | X | X | – | – |
| Editar a WIKI e a modelagem de dados | X | X | – | – |
| Criar e remover vínculos de rastreabilidade | X | X | – | – |
| Criar, editar e excluir eventos | X | X | – | – |
| Enviar e excluir arquivos | X | X | – | – |
| Convidar, promover e remover participantes | X | X | – | – |
| Responder solicitações | X | X | – | – |
| Consultar a auditoria do projeto | X | X | – | – |
| Exportar CSV diretamente | X | X | – | – |
| Solicitar alteração ou reprovação de requisito | – | – | X | X |
| Solicitar evento ou exportação | – | – | X | X |
| Solicitar aprovação de requisito | – | – | – | X |
| Excluir o projeto | X | – | – | – |

