/** Pesquisa do TCC: tipos espelhando o backend (/api/pesquisa). */

export type EstadoPesquisa =
  | 'NAO_ELEGIVEL'
  | 'PENDENTE_ANTES'
  | 'AGUARDANDO_DEPOIS'
  | 'PENDENTE_DEPOIS'
  | 'CONCLUIDA'
  | 'RECUSOU'
  | 'RETIRADA';

export type SituacaoParticipacao = 'PARTICIPANDO' | 'RECUSOU' | 'RETIRADA';

export type EtapaPesquisa = 'ANTES' | 'DEPOIS';

export interface OpcaoInstrumento {
  valor: string;
  rotulo: string;
}

export interface ItemInstrumento {
  numero: number;
  textoAntes: string;
  textoDepois: string;
}

export interface EtapaInstrumento {
  cabecalho: string;
  instrucao: string;
  perguntaAberta: string;
}

/** Textos do questionário, sempre na versão vigente (fonte única: o backend). */
export interface Instrumento {
  versao: string;
  tituloTermo: string;
  termo: string[];
  textoConcordo: string;
  escala: string[];
  antes: EtapaInstrumento;
  depois: EtapaInstrumento;
  itens: ItemInstrumento[];
  perguntaFuncao: string;
  funcoes: OpcaoInstrumento[];
  perguntaTempoExperiencia: string;
  temposExperiencia: OpcaoInstrumento[];
  perguntaFerramentas: string;
  ferramentas: OpcaoInstrumento[];
}

export interface SituacaoPesquisa {
  estado: EstadoPesquisa;
  situacaoParticipacao: SituacaoParticipacao | null;
  codigo: string | null;
  antesRespondidaEm: string | null;
  depoisRespondidaEm: string | null;
  depoisDisponivelEm: string | null;
  coletaAberta: boolean;
  instrumento: Instrumento;
}

export interface RespostaAntes {
  consentimento: boolean;
  itens: number[];
  respostaAberta: string | null;
  funcao: string;
  tempoExperiencia: string;
  ferramentas: string[];
  ferramentaOutro: string | null;
}

export interface RespostaDepois {
  itens: number[];
  respostaAberta: string | null;
}

export const TAMANHO_MAXIMO_ABERTA = 2000;
export const TAMANHO_MAXIMO_FERRAMENTA_OUTRO = 100;
