# Protocolo de busca dos trabalhos relacionados

Registro do protocolo usado na análise do estado da arte do artigo e da monografia. Os registros retornados, os trabalhos analisados e a classificação estão na planilha [Estado_da_Arte_Busca_e_Artigos.xlsx](Estado_da_Arte_Busca_e_Artigos.xlsx).

## Linha do tempo

- **Outubro de 2026:** levantamento inicial do estado da arte, com buscas exploratórias que identificaram os primeiros trabalhos de comparação (aba “Versão inicial (out-2026)” da planilha).
- **22 de novembro de 2026:** revisão geral, com a execução do protocolo abaixo nas cinco bases. A execução das strings e a primeira triagem tiveram apoio de ferramenta de inteligência artificial (Claude, Anthropic) e foram revisadas em conjunto pelos autores.

## Diretrizes

Kitchenham e Charters (2007) para os elementos do protocolo e Wohlin (2014) para o snowballing.

## Strings

- **S1, gestão de requisitos e participação:** ("requirements engineering" OR "requirements management" OR "requirements elicitation" OR "requirements validation") AND (stakeholder\* OR "user involvement" OR "user participation" OR collaborat\* OR crowd\*) AND (tool\* OR platform\* OR environment\* OR "web-based")
- **S2, requisitos e modelo de dados:** (requirement\*) AND ("data model" OR "entity-relationship" OR "database schema" OR "conceptual model") AND (traceab\* OR impact OR generat\* OR deriv\*)

## Aplicação por base

| Base | Aplicação | Identificados | Únicos na base |
|---|---|--:|--:|
| IEEE Xplore | Busca por comando; cada termo em Document Title, Abstract ou Author Keywords; anos 2016–2026. S1: 297; S2: 198. | 495 | 494 |
| ACM Digital Library | Campo Abstract; publicação de 01/01/2016 a 31/12/2026. S1: 57; S2: 43. | 100 | 99 |
| ScienceDirect | Title, abstract, keywords; 2016–2026; área Computer Science. Limite de 8 conectores por campo e sem truncamento: S1 dividida em 8 subconsultas (28, 24, 2, 2, 10, 4, 0 e 1 registros); S2: 77. | 148 | 130 |
| SBC OpenLib (SOL) | Busca em cada evento (SBQS, SBES, SBSI); sem frases entre aspas; termos em inglês e em português (consultas completas na planilha). | 63 | 58 |
| WERpapers | Triagem manual dos títulos das edições de 2016 a 2026, sem os prefácios. | 257 | 257 |
| **Total** | 22 duplicatas da ACM com outras bases | **1.063** | **1.016** |

## Critérios

- **Filtros:** período de 2016 a 2026; idiomas inglês e português; artigos de periódico, de conferência e de workshop com revisão por pares.
- **Inclusão:** (i) proposta ou avaliação de ferramenta ou ambiente de software de apoio à gestão, à elicitação ou à validação de requisitos ou à relação entre requisitos e modelo de dados; (ii) descrição suficiente para a classificação nos critérios C1 a C6; (iii) texto completo acessível gratuitamente.
- **Exclusão:** duplicatas; textos sem revisão por pares; estudos secundários sem ferramenta própria; propostas de processo sem ferramenta; trabalhos sobrepostos a outro já incluído, mantida a versão mais completa.
- **Snowballing:** uma iteração para trás nas referências dos trabalhos incluídos, aceitando-se trabalhos anteriores a 2016 apenas quando citados por pelo menos dois trabalhos incluídos.

## Fluxo de seleção

| Etapa | Quantidade |
|---|--:|
| Registros únicos triados por título e resumo | 1.016 |
| Selecionados para texto completo | 11 |
| Não recuperados (sem texto gratuito): FAME (RE 2018) | 1 |
| Incluídos pela busca nas bases | 10 |
| Snowballing: elegíveis / não recuperados / incluídos | 5 / 2 / 3 |
| **Atendem aos critérios** | **13** |
| **Na matriz de comparação (A1–A10)** | **10** |

Ficaram fora da matriz, por cobrirem parcialmente apenas C2 ou C4, já representados: Salgado Neto et al. (REW 2026), ReqGo (International Journal of Technology, 2023) e rTiWIM (WER 2022).

## Limitações declaradas

Busca restrita a bases de acesso gratuito (sem Scopus e Web of Science) e a trabalhos com texto completo gratuito; na ACM, busca aplicada apenas ao resumo; snowballing apenas para trás; triagem com apoio de IA, revisada em conjunto pelos autores, e não por avaliadores independentes; registros individuais da SOL e do WERpapers não exportados.
