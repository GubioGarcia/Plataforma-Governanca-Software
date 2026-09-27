import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

/** Endereços e credenciais do ambiente (sobrescreva por variável de ambiente). */
export const AMBIENTE = {
  api: process.env.E2E_API_URL ?? 'http://localhost/api',
  keycloak: process.env.E2E_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: process.env.E2E_REALM ?? 'plataforma_discovery',
  kcAdmin: process.env.E2E_KC_ADMIN_USER ?? 'admin',
  kcSenha: process.env.E2E_KC_ADMIN_PASS ?? 'admin',
  pgContainer: process.env.E2E_PG_CONTAINER ?? 'postgres-db',
  pgUser: process.env.E2E_PG_USER ?? 'admin',
  pgDb: process.env.E2E_PG_DB ?? 'plataforma',
};

export const SENHA = 'SenhaE2e123';

export interface Pessoa {
  apelido: string;
  nome: string;
  email: string;
  senha: string;
  /** id no banco da aplicação */
  id: string;
  /** id no Keycloak */
  kc: string;
}

export interface Resposta<T = unknown> {
  status: number;
  corpo: T;
}

export async function chamar<T = unknown>(
  metodo: string, url: string, opcoes: { token?: string; corpo?: unknown; form?: Record<string, string> } = {},
): Promise<Resposta<T>> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (opcoes.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(opcoes.form).toString();
  } else if (opcoes.corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opcoes.corpo);
  }
  if (opcoes.token) headers.Authorization = `Bearer ${opcoes.token}`;
  const r = await fetch(url, { method: metodo, headers, body });
  const texto = await r.text();
  let corpo: unknown = texto;
  try { corpo = texto ? JSON.parse(texto) : null; } catch { /* texto puro */ }
  return { status: r.status, corpo: corpo as T };
}

/** Sufixo único por execução — evita colisão de nomes/e-mails entre arquivos e rodadas. */
export function sufixo(): string {
  return randomUUID().slice(0, 8);
}

export async function cadastrar(apelido: string, tag: string): Promise<Pessoa> {
  const email = `${apelido}.ui.${tag}@exemplo.com`;
  const nome = `${apelido[0].toUpperCase()}${apelido.slice(1)} E2E ${tag}`;
  const r = await chamar<{ id: string; externalIdentityId: string }>('POST', `${AMBIENTE.api}/usuario/cadastrar`, {
    corpo: { nome, email, senha: SENHA },
  });
  if (r.status !== 201) throw new Error(`cadastro de ${email} falhou: HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
  return { apelido, nome, email, senha: SENHA, id: r.corpo.id, kc: r.corpo.externalIdentityId };
}

/**
 * Chamadas à API como uma pessoa. Faz login sob demanda e, no 401 (token revogado
 * porque os grupos da pessoa mudaram), entra de novo — como o front faz com o refresh.
 */
export class Sessao {
  private token: string | null = null;

  constructor(readonly pessoa: Pessoa) {}

  private async entrar(): Promise<string> {
    const r = await chamar<{ token: string }>('POST', `${AMBIENTE.api}/auth/login`, {
      corpo: { email: this.pessoa.email, senha: this.pessoa.senha },
    });
    if (r.status !== 200) throw new Error(`login de ${this.pessoa.email} falhou: HTTP ${r.status}`);
    this.token = r.corpo.token;
    return this.token;
  }

  async req<T = unknown>(metodo: string, caminho: string, corpo?: unknown): Promise<Resposta<T>> {
    const token = this.token ?? await this.entrar();
    let r = await chamar<T>(metodo, `${AMBIENTE.api}${caminho}`, { token, corpo });
    if (r.status === 401) {
      r = await chamar<T>(metodo, `${AMBIENTE.api}${caminho}`, { token: await this.entrar(), corpo });
    }
    return r;
  }

  /** Como req, mas falha o teste se o status não for o esperado. */
  async ok<T = unknown>(metodo: string, caminho: string, corpo?: unknown, esperado = [200, 201, 204]): Promise<T> {
    const r = await this.req<T>(metodo, caminho, corpo);
    if (!esperado.includes(r.status)) {
      throw new Error(`${metodo} ${caminho} como ${this.pessoa.apelido}: HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
    }
    return r.corpo;
  }
}

// ── Keycloak (limpeza e Admin da Plataforma) ─────────────────────────────────

async function tokenAdminKeycloak(): Promise<string> {
  const r = await chamar<{ access_token: string }>('POST', `${AMBIENTE.keycloak}/realms/master/protocol/openid-connect/token`, {
    form: { grant_type: 'password', client_id: 'admin-cli', username: AMBIENTE.kcAdmin, password: AMBIENTE.kcSenha },
  });
  if (r.status !== 200) throw new Error(`admin do Keycloak: HTTP ${r.status}`);
  return r.corpo.access_token;
}

export async function keycloak<T = unknown>(metodo: string, caminho: string, corpo?: unknown): Promise<Resposta<T>> {
  return chamar<T>(metodo, `${AMBIENTE.keycloak}/admin/realms/${AMBIENTE.realm}${caminho}`, {
    token: await tokenAdminKeycloak(), corpo,
  });
}

/** Põe a pessoa no grupo /_admin (Admin da Plataforma). */
export async function tornarAdminDaPlataforma(p: Pessoa): Promise<void> {
  const g = await keycloak<{ id: string }>('GET', '/group-by-path/_admin');
  await keycloak('PUT', `/users/${p.kc}/groups/${g.corpo.id}`);
}

// ── Banco (limpeza) ──────────────────────────────────────────────────────────

export function psql(sql: string): string {
  return execFileSync('docker', ['exec', AMBIENTE.pgContainer, 'psql', '-U', AMBIENTE.pgUser, '-d', AMBIENTE.pgDb, '-t', '-A', '-c', sql],
    { encoding: 'utf-8' }).trim();
}
