# Artefatos do projeto — Discovery Platform

Documentação de referência do TCC e do artigo, reunida para validar o projeto e a análise do estado da arte. Versões conferidas com o código deste repositório em 22/11/2026 (último commit de código: `361517c`, 02/11/2026).

| Pasta | Arquivo | Conteúdo | Versão |
|---|---|---|---|
| `01_modelagem-de-dados` | [MER_V4.txt](01_modelagem-de-dados/MER_V4.txt) | Modelo entidade-relacionamento, gerado a partir do esquema real (migrações Flyway V1–V6) | V4, 19/11/2026 |
| | [DER_V5.png](01_modelagem-de-dados/DER_V5.png) / [DER_V5.drawio](01_modelagem-de-dados/DER_V5.drawio) | Diagrama entidade-relacionamento correspondente ao MER V4 (imagem e fonte editável no draw.io) | V5, 19/11/2026 |
| `02_requisitos` | [Documento_de_Requisitos.md](02_requisitos/Documento_de_Requisitos.md) | 27 requisitos funcionais, 16 não funcionais, papéis e matriz de permissões | 2.0, 22/11/2026 |
| `03_matrizes` | [Matriz_Rastreabilidade.xlsx](03_matrizes/Matriz_Rastreabilidade.xlsx) | Requisito → necessidade, objetivo, módulo, tela, API, testes, critério do estado da arte e situação; correspondência com o questionário | 2.0, 22/11/2026 |
| | [Matriz_Risco.xlsx](03_matrizes/Matriz_Risco.xlsx) | Registro de 16 riscos com avaliação inicial (abr/2026), reavaliação (nov/2026), evidências e respostas; matrizes de probabilidade × impacto | 2.0, 22/11/2026 |
| `04_estado-da-arte` | [Protocolo_de_Busca.md](04_estado-da-arte/Protocolo_de_Busca.md) | Protocolo, strings, aplicação por base, critérios e fluxo de seleção | 22/11/2026 |
| | [Estado_da_Arte_Busca_e_Artigos.xlsx](04_estado-da-arte/Estado_da_Arte_Busca_e_Artigos.xlsx) | Consultas, fluxo de seleção, trabalhos da versão atual e da inicial com acesso (DOI/link), classificação C1–C6 com X, Y e D, ferramentas de mercado, fontes de fundamentação e registros retornados (IEEE, ScienceDirect, ACM) | 22/11/2026 |
| `05_avaliacao` | [Instrumento_de_Avaliacao.md](05_avaliacao/Instrumento_de_Avaliacao.md) | Termo de consentimento, itens das duas etapas, perguntas abertas e caracterização | v1 |
| `06_diagramas-uml` | [Diagrama_de_Casos_de_Uso.jpeg](06_diagramas-uml/Diagrama_de_Casos_de_Uso.jpeg) / [Diagrama_de_Classes.jpeg](06_diagramas-uml/Diagrama_de_Classes.jpeg) | Diagramas UML de casos de uso e de classes | — |

## Versões anteriores

As versões anteriores (MER V1–V3, DER V1–V4, lista de requisitos e matrizes de abril de 2026) permanecem na pasta de documentação da equipe e não foram incluídas aqui. A matriz de risco preserva a avaliação de abril de 2026 na aba “Matriz (abr-2026)”.

## Observações

- Os requisitos com verificação ainda planejada (desempenho, escalabilidade e usabilidade) estão indicados na matriz de rastreabilidade.
- A coleta da avaliação com gestores ainda não foi realizada; o instrumento está implementado e testado.
