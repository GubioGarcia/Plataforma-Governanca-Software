/**
 * Repositório local usado pelos módulos ainda sem API REST publicada
 * (`datamodel` e `traceability`).
 *
 * O backend já possui as entidades e os repositories desses módulos, mas
 * ainda não expõe controllers. Enquanto isso, o protótipo persiste os dados
 * no `localStorage` do navegador, por projeto — o suficiente para demonstrar
 * o fluxo completo (criar, editar e remover vínculos e impactos) sem perder
 * o estado a cada recarga.
 *
 * Quando os endpoints existirem, apenas os serviços que consomem este módulo
 * mudam: os contratos e as telas permanecem iguais.
 */

const PREFIXO = 'discovery.prototipo';

function chaveDe(colecao: string, projetoId: string): string {
  return `${PREFIXO}.${colecao}.${projetoId}`;
}

/** Lê uma coleção do projeto; devolve `null` quando ainda não foi semeada. */
export function lerColecao<T>(colecao: string, projetoId: string): T | null {
  try {
    const bruto = window.localStorage.getItem(chaveDe(colecao, projetoId));
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    // Navegador em modo privado ou armazenamento bloqueado: opera sem persistir.
    return null;
  }
}

export function gravarColecao<T>(colecao: string, projetoId: string, dados: T): void {
  try {
    window.localStorage.setItem(chaveDe(colecao, projetoId), JSON.stringify(dados));
  } catch {
    // Falha ao persistir não deve derrubar a tela — o estado segue em memória.
  }
}

export function removerColecao(colecao: string, projetoId: string): void {
  try {
    window.localStorage.removeItem(chaveDe(colecao, projetoId));
  } catch {
    // Idem: ignorar indisponibilidade do armazenamento.
  }
}

/** Id local, no formato de UUID, para registros criados no protótipo. */
export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

/** Simula a latência de uma chamada HTTP, para que os estados de carregamento das telas sejam reais. */
export function simularLatencia<T>(dados: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(dados), ms));
}
