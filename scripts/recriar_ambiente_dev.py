"""
Recria do zero o ambiente de DESENVOLVIMENTO LOCAL (banco + identidades no
Keycloak) e carrega o projeto de demonstração do TCC. Não é enviado à VM: no
ambiente hospedado use carregar_demo.sh / remover_demo.sh, que não apagam nada
fora da demo.

DESTRUTIVO: apaga o banco da aplicação inteiro, todos os usuários do realm e os
grupos de organização (/org-*) no Keycloak. O realm em si (roles, clients,
mapper, grupo /_admin) é preservado. Exige --confirmar.

Passos:
  1. para o backend;
  2. limpa o Keycloak (usuários e grupos /org-*);
  3. recria o banco da aplicação (DROP/CREATE DATABASE);
  4. sobe o backend: o Flyway cria as tabelas e os dados de referência;
  5. carrega a demo (carregar_demo em demo_comum.py): contas, seed, grupos e
     conferência com login. Nenhuma conta da demo é Admin da Plataforma — para
     isso, rode depois scripts/criar_admin.py.

Uso (com `docker compose up -d` em infrastructure/):
    py scripts/recriar_ambiente_dev.py --confirmar

Variáveis de ambiente: ver demo_comum.py (a senha da demo vem de DEV_SENHA_DEMO
ou é digitada no terminal).
"""
import sys

from demo_comum import A, BACKEND, PG_DB, SEED, carregar_demo, chamar, docker, esperar_backend, passo, psql, senha_demo, token_admin


def main():
    if "--confirmar" not in sys.argv:
        sys.exit(__doc__ + "\nNada foi feito: rode de novo com --confirmar.")
    if not SEED.exists():
        sys.exit(f"Seed não encontrado: {SEED}")
    modelo_senha = senha_demo()   # pergunta antes de apagar qualquer coisa

    passo(f"1. Parando o backend ({BACKEND})")
    docker("stop", BACKEND)

    passo("2. Limpando o Keycloak (usuários e grupos /org-*)")
    t = token_admin()
    _, grupos, _ = chamar("GET", f"{A}/groups?max=1000&briefRepresentation=true", token=t)
    orgs = [g for g in grupos if g["name"].startswith("org-")]
    for g in orgs:
        chamar("DELETE", f"{A}/groups/{g['id']}", token=t)
    _, usuarios, _ = chamar("GET", f"{A}/users?max=1000&briefRepresentation=true", token=t)
    for u in usuarios:
        chamar("DELETE", f"{A}/users/{u['id']}", token=t)
    print(f"   {len(orgs)} grupo(s) de organização e {len(usuarios)} usuário(s) removidos")

    passo(f"3. Recriando o banco '{PG_DB}'")
    psql(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{PG_DB}' AND pid <> pg_backend_pid()", banco="postgres")
    psql(f'DROP DATABASE IF EXISTS "{PG_DB}"', banco="postgres")
    psql(f'CREATE DATABASE "{PG_DB}"', banco="postgres")
    psql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS pgcrypto;')
    print("   banco vazio criado")

    passo("4. Subindo o backend (o Flyway cria as tabelas e os dados de referência)")
    docker("start", BACKEND)
    esperar_backend()
    print("   versão do schema:", psql("SELECT max(version) FROM flyway_schema_history WHERE success"),
          "| status de requisito:", psql("SELECT count(*) FROM status_requisito"))

    passo("5. Projeto de demonstração do TCC")
    carregar_demo(modelo_senha)


if __name__ == "__main__":
    main()
