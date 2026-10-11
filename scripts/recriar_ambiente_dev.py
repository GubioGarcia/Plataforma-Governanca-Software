"""
Recria do zero o ambiente de desenvolvimento (banco + identidades no Keycloak)
e carrega o projeto de demonstração do TCC (scripts/seed_tcc_projeto_demo.sql).

DESTRUTIVO: apaga o banco da aplicação inteiro, todos os usuários do realm e os
grupos de organização (/org-*) no Keycloak. O realm em si (roles, clients,
mapper, grupo /_admin) é preservado. Exige --confirmar.

Passos:
  1. para o backend;
  2. limpa o Keycloak (usuários e grupos /org-*);
  3. recria o banco da aplicação (DROP/CREATE DATABASE);
  4. sobe o backend: o Hibernate cria as tabelas e o data.sql os dados de referência;
  5. cria as contas da demo no Keycloak e roda o seed, ligando usuario.external_identity_id;
  6. reinicia o backend: a migração de grupos cria /org-{id} e /org-{id}/proj-{id}
     e põe o criador (Gubio) no _dono;
  7. põe os demais nos grupos: Luiz e Thiago gestores da organização, Plínio
     stakeholder técnico + cliente do projeto, Gubio também em /_admin;
  8. confere entrando com cada conta e lendo /api/auth/me.

Uso (com `docker compose up -d` em infrastructure/):
    py scripts/recriar_ambiente_dev.py --confirmar

Variáveis de ambiente (opcionais):
    DEV_API_URL         http://localhost:8081/api
    DEV_KEYCLOAK_URL    http://localhost:8080
    DEV_REALM           plataforma_discovery
    DEV_KC_ADMIN_USER   admin
    DEV_KC_ADMIN_PASS   admin
    DEV_PG_CONTAINER    postgres-db
    DEV_PG_USER         admin
    DEV_PG_DB           plataforma
    DEV_BACKEND         backend        (nome do container do backend)
    DEV_SENHA_DEMO      Demo@2026      (senha de todas as contas da demo)
"""
import json, os, pathlib, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

API = os.getenv("DEV_API_URL", "http://localhost:8081/api")
KC = os.getenv("DEV_KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("DEV_REALM", "plataforma_discovery")
KC_ADMIN = (os.getenv("DEV_KC_ADMIN_USER", "admin"), os.getenv("DEV_KC_ADMIN_PASS", "admin"))
PG_CONTAINER = os.getenv("DEV_PG_CONTAINER", "postgres-db")
PG_USER = os.getenv("DEV_PG_USER", "admin")
PG_DB = os.getenv("DEV_PG_DB", "plataforma")
BACKEND = os.getenv("DEV_BACKEND", "backend")
SENHA = os.getenv("DEV_SENHA_DEMO", "Demo@2026")

SEED = pathlib.Path(__file__).with_name("seed_tcc_projeto_demo.sql")
A = f"{KC}/admin/realms/{REALM}"
ORG = "0f000000-0000-0000-0000-0000000000fa"      # Fatesg (seed)
PROJ = "20000000-0000-0000-0000-000000000001"     # projeto do TCC (seed)

# e-mail → (nome, grupos além dos criados pela migração)
PESSOAS = {
    "gubiogarcia@gmail.com":           ("Gubio Garcia dos Santos",                  ["/_admin"]),
    "luizfernandopadua@gmail.com":     ("Luiz Fernando De Pádua Paixão",            [f"/org-{ORG}/_gestores"]),
    "thiagomatheus@gmail.com":         ("Thiago Matheus Onorio Ribeiro Pinheiro",   [f"/org-{ORG}/_gestores"]),
    "plinio.carneiro@fatesg.senai.br": ("Prof. Esp. Plínio Marcos Mendes Carneiro", [f"/org-{ORG}/proj-{PROJ}/_stakeholders_tecnicos",
                                                                                     f"/org-{ORG}/proj-{PROJ}/_stakeholders_clientes"]),
}


def passo(texto):
    print(f"\n── {texto}")


def chamar(metodo, url, corpo=None, token=None, form=False):
    h, d = {}, None
    if corpo is not None:
        d = urllib.parse.urlencode(corpo).encode() if form else json.dumps(corpo).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded" if form else "application/json"
    if token:
        h["Authorization"] = f"Bearer {token}"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=d, method=metodo, headers=h)) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None), r.headers
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw), e.headers
        except Exception:
            return e.code, raw.decode(errors="replace"), e.headers


def token_admin():
    s, b, _ = chamar("POST", f"{KC}/realms/master/protocol/openid-connect/token",
                     {"grant_type": "password", "client_id": "admin-cli", "username": KC_ADMIN[0], "password": KC_ADMIN[1]},
                     form=True)
    if s != 200:
        sys.exit(f"Não consegui autenticar no Keycloak como admin (HTTP {s}). O Keycloak está no ar?")
    return b["access_token"]


def docker(*args, entrada=None):
    r = subprocess.run(["docker", *args], input=entrada, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        sys.exit(f"docker {' '.join(args[:3])}... falhou:\n{r.stderr.strip()}")
    return r.stdout.strip()


def psql(sql, banco=PG_DB):
    return docker("exec", PG_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-U", PG_USER, "-d", banco, "-t", "-A", "-c", sql)


def esperar_backend(limite=240):
    inicio = time.time()
    while time.time() - inicio < limite:
        try:
            s, _, _ = chamar("GET", f"{API}/organizacao")
            if s == 401:   # no ar e exigindo autenticação
                return
        except Exception:
            pass
        time.sleep(3)
    sys.exit(f"O backend não respondeu em {limite}s — veja `docker logs {BACKEND}`.")


def main():
    if "--confirmar" not in sys.argv:
        sys.exit(__doc__ + "\nNada foi feito: rode de novo com --confirmar.")
    if not SEED.exists():
        sys.exit(f"Seed não encontrado: {SEED}")

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

    passo("4. Subindo o backend (Hibernate cria as tabelas; data.sql carrega status e prioridades)")
    docker("start", BACKEND)
    esperar_backend()
    print("   tabelas:", psql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"),
          "| status de requisito:", psql("SELECT count(*) FROM status_requisito"))

    passo("5. Contas da demo no Keycloak + seed do projeto do TCC")
    t = token_admin()
    ids = {}
    for email, (nome, _) in PESSOAS.items():
        s, b, h = chamar("POST", f"{A}/users", {
            "username": email, "email": email, "firstName": nome, "lastName": nome,
            "enabled": True, "emailVerified": True, "requiredActions": [],
            "credentials": [{"type": "password", "value": SENHA, "temporary": False}]}, token=t)
        if s != 201:
            sys.exit(f"Falha ao criar {email} no Keycloak: HTTP {s} {b}")
        ids[email] = h["Location"].rsplit("/", 1)[1]
    docker("exec", "-i", PG_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-q", "-U", PG_USER, "-d", PG_DB,
           entrada=SEED.read_text(encoding="utf-8"))
    for email, kc_id in ids.items():
        psql(f"UPDATE usuario SET external_identity_id = '{kc_id}' WHERE email = '{email}'")
    print("   requisitos:", psql(f"SELECT count(*) FROM requisito WHERE projeto_id = '{PROJ}'"),
          "| solicitações:", psql("SELECT count(*) FROM solicitacao"),
          "| usuários ligados ao Keycloak:", psql("SELECT count(*) FROM usuario WHERE external_identity_id IS NOT NULL"))

    passo("6. Reiniciando o backend (migração cria os grupos e põe o criador no _dono)")
    docker("restart", BACKEND)
    esperar_backend()
    sem_grupo = psql("SELECT (SELECT count(*) FROM organizacao WHERE keycloak_group_id IS NULL)"
                     " + (SELECT count(*) FROM projeto WHERE keycloak_group_id IS NULL)")
    if sem_grupo != "0":
        sys.exit(f"{sem_grupo} organização/projeto sem grupo no Keycloak — veja `docker logs {BACKEND}`.")
    print("   grupos da organização e do projeto criados")

    passo("7. Papéis da demo")
    t = token_admin()
    for email, (_, caminhos) in PESSOAS.items():
        for caminho in caminhos:
            s, g, _ = chamar("GET", f"{A}/group-by-path{caminho}", token=t)
            if s != 200:
                sys.exit(f"Grupo {caminho} não encontrado (HTTP {s})")
            chamar("PUT", f"{A}/users/{ids[email]}/groups/{g['id']}", token=t)
            print(f"   {email:<34} → {caminho.replace(ORG, '{fatesg}').replace(PROJ, '{tcc}')}")

    passo("8. Conferência (login + /api/auth/me)")
    ok = True
    for email in PESSOAS:
        s, b, _ = chamar("POST", f"{API}/auth/login", {"email": email, "senha": SENHA})
        if s != 200:
            print(f"   [FALHA] {email}: login HTTP {s}"); ok = False; continue
        _, me, _ = chamar("GET", f"{API}/auth/me", token=b["token"])
        org = next((o for o in me["organizacoes"] if o["id"] == ORG), None)
        proj = next((p for p in (org or {}).get("projetos", []) if p["id"] == PROJ), None)
        papel_org = org["papel"] if org else None
        papeis_proj = sorted(proj["papeis"]) if proj else []
        print(f"   {email:<34} admin={me['adminPlataforma']!s:<5} org={papel_org!s:<7} projeto={','.join(papeis_proj)}")
        if not proj:
            ok = False
    if not ok:
        sys.exit("\nAlguma conta não ficou com acesso ao projeto do TCC.")
    print(f"\nPronto. Todas as contas da demo usam a senha '{SENHA}'.")


if __name__ == "__main__":
    main()
