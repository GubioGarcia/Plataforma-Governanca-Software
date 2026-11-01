"""
Peças comuns aos scripts de ambiente (carregar_demo.py, remover_demo.py,
criar_admin.py e recriar_ambiente_dev.py): configuração por variáveis de
ambiente, chamadas HTTP ao Keycloak e ao backend, psql/docker e a carga do
projeto de demonstração do TCC.

Nenhuma senha tem valor padrão: a das contas da demo vem de DEV_SENHA_DEMO ou é
digitada no terminal (sem eco).

Variáveis de ambiente (opcionais):
    DEV_API_URL         http://localhost:8081/api
    DEV_KEYCLOAK_URL    http://localhost:8080
    DEV_REALM           plataforma_discovery
    DEV_KC_ADMIN_USER   admin
    DEV_KC_ADMIN_PASS   admin           (só o ambiente local usa este padrão)
    DEV_PG_CONTAINER    postgres-db
    DEV_PG_USER         admin
    DEV_PG_DB           plataforma
    DEV_BACKEND         backend         (nome do container do backend)
    DEV_SENHA_DEMO      senha das contas da demo; "{nome}" vira o primeiro nome da
                        pessoa, sem acento (ex.: "Demo@{nome}2026"). Sem ela, é pedida.
"""
import getpass, json, os, pathlib, subprocess, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request

API = os.getenv("DEV_API_URL", "http://localhost:8081/api")
KC = os.getenv("DEV_KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("DEV_REALM", "plataforma_discovery")
KC_ADMIN = (os.getenv("DEV_KC_ADMIN_USER", "admin"), os.getenv("DEV_KC_ADMIN_PASS", "admin"))
PG_CONTAINER = os.getenv("DEV_PG_CONTAINER", "postgres-db")
PG_USER = os.getenv("DEV_PG_USER", "admin")
PG_DB = os.getenv("DEV_PG_DB", "plataforma")
BACKEND = os.getenv("DEV_BACKEND", "backend")

A = f"{KC}/admin/realms/{REALM}"
SEED = pathlib.Path(__file__).with_name("seed_tcc_projeto_demo.sql")
ORG = "0f000000-0000-0000-0000-0000000000fa"      # Fatesg (seed)
PROJ = "20000000-0000-0000-0000-000000000001"     # projeto do TCC (seed)

# e-mail → (nome, grupos além dos criados pela migração). A demo só tem papéis de
# organização e projeto: Admin da Plataforma é uma conta própria (criar_admin.py).
PESSOAS = {
    "gubio@email.com":        ("Gubio Garcia dos Santos",                  []),
    "luizfernando@email.com": ("Luiz Fernando De Pádua Paixão",            [f"/org-{ORG}/_gestores"]),
    "thiago@email.com":       ("Thiago Matheus Onorio Ribeiro Pinheiro",   [f"/org-{ORG}/_gestores"]),
    "plinio@email.com":       ("Prof. Esp. Plínio Marcos Mendes Carneiro", [f"/org-{ORG}/proj-{PROJ}/_stakeholders_tecnicos",
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


def usuario_keycloak(t, email):
    """Id do usuário no Keycloak pelo e-mail, ou None."""
    _, encontrados, _ = chamar("GET", f"{A}/users?exact=true&email={urllib.parse.quote(email)}", token=t)
    return encontrados[0]["id"] if encontrados else None


def grupo(t, caminho):
    s, g, _ = chamar("GET", f"{A}/group-by-path{caminho}", token=t)
    return g if s == 200 else None


def docker(*args, entrada=None):
    r = subprocess.run(["docker", *args], input=entrada, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        sys.exit(f"docker {' '.join(args[:3])}... falhou:\n{r.stderr.strip()}")
    return r.stdout.strip()


def psql(sql, banco=PG_DB):
    return docker("exec", PG_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-U", PG_USER, "-d", banco, "-t", "-A", "-c", sql)


def psql_script(sql):
    return docker("exec", "-i", PG_CONTAINER, "psql", "-v", "ON_ERROR_STOP=1", "-q", "-U", PG_USER, "-d", PG_DB, entrada=sql)


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


def ler_senha(rotulo):
    """Lê uma senha no terminal, sem eco, com confirmação. Nunca a imprime."""
    senha = getpass.getpass(f"{rotulo}: ")
    if senha != getpass.getpass(f"{rotulo} (confirme): "):
        sys.exit("As senhas não conferem. Nada foi feito.")
    return senha


def senha_demo():
    """Modelo da senha das contas da demo: DEV_SENHA_DEMO ou digitado no terminal."""
    modelo = os.getenv("DEV_SENHA_DEMO") or ler_senha('Senha das contas da demo ("{nome}" vira o primeiro nome)')
    if any(len(senha_de(modelo, email)) < 8 for email in PESSOAS):
        sys.exit("A senha da demo precisa ter no mínimo 8 caracteres (política do realm).")
    return modelo


def senha_de(modelo, email):
    """Aplica o primeiro nome (sem títulos como "Prof." e sem acento) no lugar de {nome}."""
    primeiro = next(p for p in PESSOAS[email][0].split() if not p.endswith("."))
    sem_acento = unicodedata.normalize("NFKD", primeiro).encode("ascii", "ignore").decode()
    return modelo.replace("{nome}", sem_acento)


def carregar_demo(modelo_senha):
    """
    Carga ADITIVA e idempotente da demo: não apaga nada fora dela. Contas que já
    existem no Keycloak são mantidas e recebem a senha informada.
    """
    passo("Contas da demo no Keycloak")
    esperar_backend()
    t = token_admin()
    ids = {}
    for email, (nome, _) in PESSOAS.items():
        kc_id = usuario_keycloak(t, email)
        credencial = {"type": "password", "value": senha_de(modelo_senha, email), "temporary": False}
        if kc_id:
            s, b, _ = chamar("PUT", f"{A}/users/{kc_id}/reset-password", credencial, token=t)
            if s != 204:
                sys.exit(f"Falha ao redefinir a senha de {email}: HTTP {s} {b}")
            print(f"   {email:<34} já existia (senha redefinida)")
        else:
            s, b, h = chamar("POST", f"{A}/users", {
                "username": email, "email": email, "firstName": nome, "lastName": nome,
                "enabled": True, "emailVerified": True, "requiredActions": [],
                "credentials": [credencial]}, token=t)
            if s != 201:
                sys.exit(f"Falha ao criar {email} no Keycloak: HTTP {s} {b}")
            kc_id = h["Location"].rsplit("/", 1)[1]
            print(f"   {email:<34} criada")
        ids[email] = kc_id

    passo("Projeto do TCC no banco (seed idempotente)")
    psql_script(SEED.read_text(encoding="utf-8"))
    for email, kc_id in ids.items():
        psql(f"UPDATE usuario SET external_identity_id = '{kc_id}' WHERE email = '{email}'")
    print("   requisitos:", psql(f"SELECT count(*) FROM requisito WHERE projeto_id = '{PROJ}'"),
          "| solicitações:", psql(f"SELECT count(*) FROM solicitacao WHERE projeto_id = '{PROJ}'"))

    sem_grupo = lambda: psql(f"SELECT (SELECT count(*) FROM organizacao WHERE id = '{ORG}' AND keycloak_group_id IS NULL)"
                             f" + (SELECT count(*) FROM projeto WHERE id = '{PROJ}' AND keycloak_group_id IS NULL)")
    if sem_grupo() != "0":
        passo("Reiniciando o backend (a migração cria os grupos e põe o criador no _dono)")
        docker("restart", BACKEND)
        esperar_backend()
        # A migração roda depois de o backend já responder; em máquina lenta leva mais de um minuto.
        for _ in range(60):
            if sem_grupo() == "0":
                break
            time.sleep(5)
        if sem_grupo() != "0":
            sys.exit(f"Organização/projeto da demo sem grupo no Keycloak — veja `docker logs {BACKEND}`.")
        print("   grupos da organização e do projeto criados")

    passo("Papéis da demo")
    t = token_admin()
    admin = grupo(t, "/_admin")
    for email, (_, caminhos) in PESSOAS.items():
        # garante que nenhuma conta da demo é Admin da Plataforma (versões antigas punham o Gubio)
        if admin:
            chamar("DELETE", f"{A}/users/{ids[email]}/groups/{admin['id']}", token=t)
        for caminho in caminhos:
            g = grupo(t, caminho)
            if not g:
                sys.exit(f"Grupo {caminho} não encontrado")
            chamar("PUT", f"{A}/users/{ids[email]}/groups/{g['id']}", token=t)
            print(f"   {email:<34} → {caminho.replace(ORG, '{fatesg}').replace(PROJ, '{tcc}')}")

    passo("Conferência (login + /api/auth/me)")
    ok = True
    for email in PESSOAS:
        s, b, _ = chamar("POST", f"{API}/auth/login", {"email": email, "senha": senha_de(modelo_senha, email)})
        if s != 200:
            print(f"   [FALHA] {email}: login HTTP {s}"); ok = False; continue
        _, me, _ = chamar("GET", f"{API}/auth/me", token=b["token"])
        org = next((o for o in me["organizacoes"] if o["id"] == ORG), None)
        proj = next((p for p in (org or {}).get("projetos", []) if p["id"] == PROJ), None)
        papel_org = org["papel"] if org else None
        papeis_proj = sorted(proj["papeis"]) if proj else []
        print(f"   {email:<34} admin={me['adminPlataforma']!s:<5} org={papel_org!s:<7} projeto={','.join(papeis_proj)}")
        if not proj or me["adminPlataforma"]:
            ok = False
    if not ok:
        sys.exit("\nAlguma conta não ficou com o acesso esperado ao projeto do TCC.")
    print("\nDemo carregada. A senha não é exibida: repasse-a por um canal fora do repositório.")
