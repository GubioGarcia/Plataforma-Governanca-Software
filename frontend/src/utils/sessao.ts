/**
 * Marca de "houve login neste navegador". Não é credencial (a sessão de verdade é
 * o cookie HttpOnly de refresh): só evita que a abertura da landing chame
 * /auth/refresh — e gere um 401 — para quem nunca entrou.
 */
const CHAVE_MARCA = 'discovery:sessao';

export function temMarcaDeSessao(): boolean {
  try {
    return localStorage.getItem(CHAVE_MARCA) === '1';
  } catch {
    // Sem acesso ao storage (modo privado, bloqueio): tenta restaurar a sessão mesmo assim
    return true;
  }
}

export function marcarSessao(ativa: boolean): void {
  try {
    if (ativa) localStorage.setItem(CHAVE_MARCA, '1');
    else localStorage.removeItem(CHAVE_MARCA);
  } catch {
    // storage indisponível: a marca é só uma otimização
  }
}

export const DESTINO_PADRAO = '/organizations';

/**
 * Destino pós-login vindo de ?next=. Só aceita caminhos internos ("/admin",
 * "/organizations/x?aba=y"): nada com esquema, host, "//" ou barra invertida,
 * para não virar open redirect.
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return DESTINO_PADRAO;
  try {
    const url = new URL(next, 'http://interno.invalid');
    if (url.origin !== 'http://interno.invalid') return DESTINO_PADRAO;
    const destino = url.pathname + url.search + url.hash;
    // Voltar para as telas de entrada não faz sentido depois de entrar
    if (['/', '/login', '/cadastro'].includes(url.pathname)) return DESTINO_PADRAO;
    return destino;
  } catch {
    return DESTINO_PADRAO;
  }
}
