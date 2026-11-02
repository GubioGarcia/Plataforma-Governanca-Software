"""
Cria (ou confirma) a conta de Admin da Plataforma. Roda NA VM, pelo
criar_admin.sh, ou no ambiente local:
    py scripts/criar_admin.py <email> [--nome "Administrador da Plataforma"]

  1. a senha é digitada no terminal, sem eco e com confirmação; não é aceita por
     argumento nem por variável de ambiente, não é gravada e não é impressa;
  2. a conta é criada pelo próprio cadastro da plataforma (POST /api/usuario/cadastrar),
     que registra o usuário no Keycloak e na tabela usuario e aplica a política de senha;
  3. a conta entra no grupo /_admin do Keycloak.

Idempotente: se a conta já existe, não pede senha e só garante o grupo /_admin.
A conta de admin é exclusiva: uma conta que já participa de organização ou projeto
é recusada (o backend também impede o admin de criar organização ou aceitar convite).
É o ÚNICO caminho para alguém virar Admin da Plataforma: nenhuma tela faz isso.
"""
import argparse, re, sys

from demo_comum import API, A, chamar, grupo, ler_senha, passo, psql, token_admin, usuario_keycloak


def main():
    p = argparse.ArgumentParser(description="Cria a conta de Admin da Plataforma.")
    p.add_argument("email")
    p.add_argument("--nome", default="Administrador da Plataforma")
    args = p.parse_args()
    email = args.email.strip().lower()
    if not re.fullmatch(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", email):
        sys.exit(f"E-mail inválido: {email}")

    t = token_admin()
    kc_id = usuario_keycloak(t, email)
    if kc_id:
        passo(f"Conta {email} já existe: só confere o grupo /_admin")
        # A conta de admin é exclusiva da área administrativa: não pode ser também usuário comum
        _, grupos, _ = chamar("GET", f"{A}/users/{kc_id}/groups?briefRepresentation=true", token=t)
        comuns = [g["path"] for g in grupos if g["path"].startswith("/org-")]
        if comuns:
            sys.exit(f"A conta {email} participa de {len(comuns)} grupo(s) de organização/projeto. "
                     "O Admin da Plataforma precisa de uma conta exclusiva: use outro e-mail.")
    else:
        passo(f"Criando a conta {email}")
        senha = ler_senha("Senha do Admin da Plataforma")
        s, b, _ = chamar("POST", f"{API}/usuario/cadastrar", {"nome": args.nome, "email": email, "senha": senha})
        del senha
        if s != 201:
            detalhe = b.get("detail") if isinstance(b, dict) else b
            sys.exit(f"Cadastro recusado (HTTP {s}): {detalhe}")
        t = token_admin()
        kc_id = usuario_keycloak(t, email)
        if not kc_id:
            sys.exit("A conta foi cadastrada, mas não foi encontrada no Keycloak.")

    if psql(f"SELECT count(*) FROM usuario WHERE email = '{email}' AND ativo") != "1":
        sys.exit("A conta existe no Keycloak, mas não está ativa na tabela usuario. Verifique antes de continuar.")

    admin = grupo(t, "/_admin")
    if not admin:
        sys.exit("Grupo /_admin não encontrado no realm.")
    s, _, _ = chamar("PUT", f"{A}/users/{kc_id}/groups/{admin['id']}", token=t)
    if s != 204:
        sys.exit(f"Falha ao pôr a conta no grupo /_admin (HTTP {s}).")

    _, membros, _ = chamar("GET", f"{A}/groups/{admin['id']}/members?briefRepresentation=true", token=t)
    print(f"   membros de /_admin: {', '.join(m['username'] for m in membros)}")
    print("\nPronto. Entre na plataforma com essa conta para conferir o acesso à área administrativa.")


if __name__ == "__main__":
    main()
