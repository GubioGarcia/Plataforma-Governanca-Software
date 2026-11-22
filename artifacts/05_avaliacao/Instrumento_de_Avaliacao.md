# Instrumento de avaliação com gestores (versão v1)

Questionário aplicado na própria plataforma aos usuários com papel de **Dono** ou **Gestor**, enquanto a coleta estiver aberta (RF26 e RF27 do [Documento de Requisitos](../02_requisitos/Documento_de_Requisitos.md)). O texto abaixo reproduz o instrumento implementado em `backend/.../modules/survey/domain/InstrumentoPesquisa.java`.

## Termo de consentimento

> Esta pesquisa faz parte do Trabalho de Conclusão de Curso de Engenharia de Software da Faculdade SENAI Fatesg. O objetivo é comparar como as fases de discovery e elicitação de requisitos são conduzidas hoje com a percepção sobre esta plataforma, depois de usá-la.
>
> São duas etapas curtas, de cerca de 3 minutos cada: uma agora, antes de usar a plataforma, e outra depois. A participação é voluntária e pode ser interrompida a qualquer momento.
>
> As respostas são analisadas de forma agregada e identificadas apenas por um código; seu nome e seu e-mail não aparecem nos resultados. Você pode retirar sua participação a qualquer momento em Meu Perfil, e suas respostas serão apagadas.
>
> Nas respostas abertas, evite informar nomes de pessoas, de clientes ou dados confidenciais.

Aceite: “Li e concordo em participar.”

**Escala:** 1 Discordo totalmente; 2 Discordo; 3 Neutro; 4 Concordo; 5 Concordo totalmente.

## Itens e critérios do estado da arte

| Item | Critério | Primeira etapa (antes do uso) | Segunda etapa (após o uso) |
|:-:|:-:|---|---|
| 1 | C6 | As informações das fases iniciais do projeto (visão do produto, requisitos, decisões, reuniões e arquivos) ficam reunidas em um único lugar, acessível a todos os envolvidos. | Na plataforma, as informações das fases iniciais do projeto (visão do produto, requisitos, decisões, eventos e arquivos) ficam reunidas em um único lugar, acessível a todos os envolvidos. |
| 2 | C2 | Os stakeholders (clientes e usuários) participam de forma contínua da discussão e da validação dos requisitos, e não apenas em reuniões pontuais. | A plataforma permite que os stakeholders participem de forma contínua da discussão e da validação dos requisitos. |
| 3 | C3 | Quando um stakeholder pede a aprovação, a alteração ou a reprovação de um requisito, existe um canal formal em que o pedido, a justificativa e a resposta do gestor ficam registrados. | A plataforma oferece um canal formal em que os pedidos de aprovação, alteração ou reprovação de requisitos, a justificativa e a resposta do gestor ficam registrados. |
| 4 | C1 | É fácil identificar quem aprovou cada requisito, quando isso aconteceu e quais alterações ele sofreu ao longo do projeto. | Na plataforma, é fácil identificar quem aprovou cada requisito, quando isso aconteceu e quais alterações ele sofreu. |
| 5 | C4 e C5 | Quando um requisito muda, é fácil identificar quais outros requisitos e quais dados do sistema (entidades e atributos) são afetados. | Com a matriz de rastreabilidade e a modelagem de dados, é fácil identificar quais outros requisitos e quais dados do sistema são afetados quando um requisito muda. |

## Perguntas abertas (opcionais)

- **Primeira etapa:** Descreva uma situação recente em que a forma como as informações ou as decisões das fases iniciais foram registradas ou comunicadas causou retrabalho ou desalinhamento com os stakeholders.
- **Segunda etapa:** Quais recursos da plataforma mais contribuiriam para o seu trabalho nas fases iniciais de um projeto, e o que você mudaria ou acrescentaria?

## Caracterização do participante (primeira etapa)

- Função atual.
- Tempo de experiência com projetos de software: até 5, 6 a 10, 11 a 15 ou mais de 15 anos.
- Ferramentas usadas hoje para registrar e discutir requisitos (múltipla escolha): Jira, Confluence, Azure DevOps, Jama Connect, IBM DOORS, Productboard, planilhas ou documentos de texto, e-mail ou aplicativos de mensagem, outra.

## Regras de aplicação

- A segunda etapa é liberada após o intervalo mínimo definido pelo Admin da Plataforma.
- Cada etapa pode ser respondida uma única vez.
- Ao gravar a primeira etapa, o servidor registra se o participante já havia realizado ações na plataforma (uso prévio), e as estatísticas podem ser calculadas sem esses participantes.
- As respostas são identificadas por código sequencial (P-001, P-002…), não são registradas na auditoria nem nos indicadores de engajamento, e a exportação em CSV não contém nome nem e-mail.
