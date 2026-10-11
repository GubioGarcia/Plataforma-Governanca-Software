"""
Teste ponta a ponta da autorização (Fases 0–6) contra o ambiente Docker.

Cria usuários descartáveis (dono, gestor, membro, convidado, estranho, admin),
percorre o cenário completo pela API real (backend + Keycloak) e limpa tudo no fim.

Uso (com `docker compose up -d` em infrastructure/):
    py scripts/e2e/e2e_autorizacao.py

Variáveis de ambiente (todas opcionais):
    E2E_API_URL          http://localhost:8081/api
    E2E_KEYCLOAK_URL     http://localhost:8080
    E2E_REALM            plataforma_discovery
    E2E_KC_ADMIN_USER    admin
    E2E_KC_ADMIN_PASS    admin
    E2E_PG_CONTAINER     postgres-db   (vazio = não limpa o banco)
    E2E_PG_USER          admin
    E2E_PG_DB            plataforma

Sai com código 0 se todas as verificações passarem.
"""
import base64, http.cookiejar, json, os, subprocess, sys, urllib.error, urllib.parse, urllib.request, uuid

API = os.getenv("E2E_API_URL", "http://localhost:8081/api")
KC = os.getenv("E2E_KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("E2E_REALM", "plataforma_discovery")
KC_ADMIN = (os.getenv("E2E_KC_ADMIN_USER", "admin"), os.getenv("E2E_KC_ADMIN_PASS", "admin"))
PG = (os.getenv("E2E_PG_CONTAINER", "postgres-db"), os.getenv("E2E_PG_USER", "admin"), os.getenv("E2E_PG_DB", "plataforma"))
A = f"/admin/realms/{REALM}"

SENHA, SENHA_NOVA = "SenhaTeste123", "SenhaNova456"
SUF = uuid.uuid4().hex[:8]
resultados = []


def check(nome, cond, det=""):
    resultados.append((nome, bool(cond)))
    print(f"  [{'OK' if cond else 'FALHA'}] {nome}" + (f" — {det}" if det and not cond else ""))


def secao(titulo):
    print(f"\n=== {titulo} ===")


def detalhe(b):
    return b.get("detail") if isinstance(b, dict) else str(b)[:160]


def payload(jwt):
    p = jwt.split(".")[1]
    return json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)))


def chamar(opener, metodo, url, corpo=None, token=None, form=False, multipart=None):
    h, d = {}, None
    if multipart is not None:
        nome, conteudo = multipart
        fronteira = uuid.uuid4().hex
        d = (f"--{fronteira}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{nome}\"\r\n"
             f"Content-Type: text/plain\r\n\r\n").encode() + conteudo + f"\r\n--{fronteira}--\r\n".encode()
        h["Content-Type"] = f"multipart/form-data; boundary={fronteira}"
    elif corpo is not None:
        d = urllib.parse.urlencode(corpo).encode() if form else json.dumps(corpo).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded" if form else "application/json"
    if token:
        h["Authorization"] = f"Bearer {token}"
    try:
        with opener.open(urllib.request.Request(url, data=d, method=metodo, headers=h)) as r:
            raw, ct = r.read(), r.headers.get("Content-Type", "")
            corpo = json.loads(raw) if raw and "json" in ct else (raw.decode("utf-8") if raw else None)
            return r.status, corpo, r.headers
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw), e.headers
        except Exception:
            return e.code, raw.decode(errors="replace"), e.headers


SEM_COOKIE = urllib.request.build_opener()


def kc_admin_token():
    _, b, _ = chamar(SEM_COOKIE, "POST", f"{KC}/realms/master/protocol/openid-connect/token",
                   {"grant_type": "password", "client_id": "admin-cli", "username": KC_ADMIN[0], "password": KC_ADMIN[1]},
                   form=True)
    return b["access_token"]


def kc(metodo, caminho, corpo=None):
    s, b, _ = chamar(SEM_COOKIE, metodo, f"{KC}{A}{caminho}", corpo, token=kc_admin_token())
    return s, b


def psql(sql):
    if not PG[0]:
        return "(limpeza do banco desativada)"
    r = subprocess.run(["docker", "exec", PG[0], "psql", "-U", PG[1], "-d", PG[2], "-t", "-A", "-c", sql],
                       capture_output=True, text=True)
    return (r.stdout.strip() or r.stderr.strip()).replace("\n", " ")


class Pessoa:
    """Um usuário com sessão própria: cookie de refresh e renovação automática no 401 (como o front)."""

    def __init__(self, apelido):
        self.email = f"{apelido}.e2e.{SUF}@exemplo.com"
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.token = None
        s, u, _ = self.raw("POST", "/usuario/cadastrar", {"nome": apelido.capitalize(), "email": self.email, "senha": SENHA})
        assert s == 201, (s, u)
        self.id, self.kc = u["id"], u["externalIdentityId"]
        self.login()

    def login(self, senha=SENHA):
        s, b, h = self.raw("POST", "/auth/login", {"email": self.email, "senha": senha})
        if s == 200:
            self.token = b["token"]
        return s, b, h

    def raw(self, metodo, caminho, corpo=None, **kw):
        return chamar(self.op, metodo, API + caminho, corpo, token=kw.pop("token", self.token), **kw)

    def req(self, metodo, caminho, corpo=None, **kw):
        s, b, _ = self.raw(metodo, caminho, corpo, **kw)
        if s == 401:
            s2, r, _ = self.raw("POST", "/auth/refresh")
            if s2 == 200:
                self.token = r["token"]
                s, b, _ = self.raw(metodo, caminho, corpo, **kw)
        return s, b

    def status(self, metodo, caminho, corpo=None, **kw):
        return self.req(metodo, caminho, corpo, **kw)[0]


pessoas = []
org_id = None
extras_status, extras_prioridade = [], []

try:
    # ─────────────────────────────────────────────────────────────────────────
    secao("1. Realm do Keycloak (Fase 1)")
    s, roles = kc("GET", "/roles?first=0&max=1000")
    nomes = {r["name"] for r in roles}
    check("roles do modelo novo presentes e ORG_ADMIN removida",
          {"ORG_OWNER", "ORG_MANAGER", "PROJECT_OWNER", "PLATFORM_ADMIN", "SOLICITACAO_RESPONDER"} <= nomes and "ORG_ADMIN" not in nomes)
    _, clientes = kc("GET", "/clients?clientId=plataforma-api-client")
    _, mappers = kc("GET", f"/clients/{clientes[0]['id']}/protocol-mappers/models")
    gm = next((m for m in mappers if m["name"] == "groups"), None)
    check("mapper 'groups' com caminho completo", gm and gm["config"].get("full.path") == "true")
    s, g_admin = kc("GET", "/group-by-path/_admin")
    check("grupo /_admin existe", s == 200)

    # ─────────────────────────────────────────────────────────────────────────
    secao("2. Sessão: login, cookie, /me, refresh, revogação (Fase 5)")
    dono = Pessoa("dono"); pessoas.append(dono)
    s, b, h = dono.raw("POST", "/auth/login", {"email": dono.email, "senha": "errada999"})
    check("login com senha errada → 401", s == 401, f"HTTP {s}")
    s, b, h = dono.login()
    cookie = h.get("Set-Cookie", "")
    check("login → 200 com token e expiresIn", s == 200 and b["token"] and b["expiresIn"] > 0, f"HTTP {s}")
    check("refresh token só no cookie HttpOnly/SameSite=Strict/Path=/api/auth",
          all(x in cookie for x in ["plataforma_refresh=", "HttpOnly", "SameSite=Strict", "Path=/api/auth"])
          and "refresh" not in json.dumps(b).lower(), cookie[:120])
    check("token sem grupos antes de participar de algo", not payload(dono.token).get("groups"))
    s, me = dono.req("GET", "/auth/me")
    check("/me vazio", s == 200 and me["organizacoes"] == [] and me["adminPlataforma"] is False, str(me)[:120])
    s, _, _ = chamar(SEM_COOKIE, "GET", f"{API}/organizacao")
    check("sem token → 401", s == 401, f"HTTP {s}")

    token_antigo = dono.token
    s, org = dono.req("POST", "/organizacao", {"nome": f"Org E2E {SUF}", "descricao": "e2e", "plano": "FREE"})
    check("cria organização", s == 201, f"HTTP {s} {detalhe(org)}")
    org_id = org["id"]
    s, _, h = dono.raw("GET", "/auth/me", token=token_antigo)
    check("token anterior revogado (virou Dono) → 401", s == 401 and "invalid_token" in h.get("WWW-Authenticate", ""), f"HTTP {s}")
    s, b, _ = dono.raw("POST", "/auth/refresh", token=token_antigo)
    check("refresh pelo cookie (ignora bearer revogado) → token novo", s == 200 and b["token"] != token_antigo, f"HTTP {s}")
    dono.token = b["token"]
    check("token novo traz o grupo /org-{id}/_dono", f"/org-{org_id}/_dono" in (payload(dono.token).get("groups") or []))

    # ─────────────────────────────────────────────────────────────────────────
    secao("3. Grupos no Keycloak (Fase 2)")
    for sub in ["_dono", "_gestores", "_membros"]:
        s, _ = kc("GET", f"/group-by-path/org-{org_id}/{sub}")
        check(f"subgrupo /org-{{id}}/{sub}", s == 200)
    s, proj = dono.req("POST", "/projeto", {"organizacaoId": org_id, "nome": f"Proj A {SUF}", "descricao": "e2e"})
    check("dono cria projeto A", s == 201, f"HTTP {s} {detalhe(proj)}")
    s, proj_b = dono.req("POST", "/projeto", {"organizacaoId": org_id, "nome": f"Proj B {SUF}", "descricao": "e2e"})
    pa, pb = proj["id"], proj_b["id"]
    for sub in ["_dono", "_gestores", "_stakeholders_tecnicos", "_stakeholders_clientes"]:
        s, _ = kc("GET", f"/group-by-path/org-{org_id}/proj-{pa}/{sub}")
        check(f"subgrupo /org/proj/{sub}", s == 200)
    s, g = kc("GET", f"/group-by-path/org-{org_id}")
    check("keycloak_group_id do banco = grupo no Keycloak",
          psql(f"select keycloak_group_id from organizacao where id='{org_id}'") == g["id"])

    # ─────────────────────────────────────────────────────────────────────────
    secao("4. Fase 0: alterar senha e auditoria somente leitura")
    estranho = Pessoa("estranho"); pessoas.append(estranho)
    url = "/usuario/alterarSenha"
    s, _, _ = chamar(SEM_COOKIE, "PATCH", API + url, {"senhaAtual": SENHA, "novaSenha": SENHA_NOVA, "confirmacaoSenha": SENHA_NOVA})
    check("alterarSenha sem token → 401", s == 401, f"HTTP {s}")
    check("senha atual errada → 400",
          estranho.status("PATCH", url, {"senhaAtual": "errada123", "novaSenha": SENHA_NOVA, "confirmacaoSenha": SENHA_NOVA}) == 400)
    check("confirmação diferente → 400",
          estranho.status("PATCH", url, {"senhaAtual": SENHA, "novaSenha": SENHA_NOVA, "confirmacaoSenha": "outra12345"}) == 400)
    check("troca de senha → 204",
          estranho.status("PATCH", url, {"senhaAtual": SENHA, "novaSenha": SENHA_NOVA, "confirmacaoSenha": SENHA_NOVA}) == 204)
    check("senha antiga não loga mais", estranho.login(SENHA)[0] == 401)
    check("senha nova loga", estranho.login(SENHA_NOVA)[0] == 200)
    for metodo, caminho in [("POST", "/auditoria"), ("PUT", f"/auditoria/{uuid.uuid4()}"), ("DELETE", f"/auditoria/{uuid.uuid4()}")]:
        s = dono.status(metodo, caminho, {} if metodo != "DELETE" else None)
        check(f"{metodo} auditoria → 405", s == 405, f"HTTP {s}")

    # ─────────────────────────────────────────────────────────────────────────
    secao("5. Convites e papéis (Fase 6)")
    gestor, membro, convidado = Pessoa("gestor"), Pessoa("membro"), Pessoa("convidado")
    pessoas += [gestor, membro, convidado]
    s, c_gestor = dono.req("POST", f"/organizacao/{org_id}/convites", {"email": gestor.email, "papel": "GESTOR"})
    check("dono convida Gestor para a organização", s == 201, f"HTTP {s} {detalhe(c_gestor)}")
    s, c_membro = dono.req("POST", f"/organizacao/{org_id}/convites", {"email": membro.email, "papel": "MEMBRO"})
    s, c_conv = dono.req("POST", f"/projeto/{pa}/convites", {"email": convidado.email, "papel": "STAKEHOLDER"})
    check("dono convida stakeholder só para o projeto A", s == 201, f"HTTP {s} {detalhe(c_conv)}")
    check("convite pendente repetido → 409",
          dono.status("POST", f"/organizacao/{org_id}/convites", {"email": membro.email, "papel": "MEMBRO"}) == 409)
    check("papel de projeto em convite de organização → 422",
          dono.status("POST", f"/organizacao/{org_id}/convites", {"email": "x@x.com", "papel": "STAKEHOLDER"}) == 422)
    check("sem vínculo não convida → 403",
          estranho.status("POST", f"/organizacao/{org_id}/convites", {"email": "x@x.com", "papel": "MEMBRO"}) == 403)
    check("convite alheio não pode ser aceito → 403", estranho.status("POST", f"/convites/{c_membro['id']}/aceitar") == 403)

    s, c_rec = dono.req("POST", f"/projeto/{pb}/convites", {"email": estranho.email, "papel": "STAKEHOLDER"})
    s, meus = estranho.req("GET", "/convites/meus")
    check("convidado vê o convite em /convites/meus", s == 200 and any(c["id"] == c_rec["id"] for c in meus))
    check("recusar convite → 200", estranho.status("POST", f"/convites/{c_rec['id']}/recusar") == 200)
    s, c_can = dono.req("POST", f"/projeto/{pb}/convites", {"email": estranho.email, "papel": "STAKEHOLDER"})
    check("quem convidou cancela → 204", dono.status("DELETE", f"/convites/{c_can['id']}") == 204)
    check("convite cancelado não é aceito → 422", estranho.status("POST", f"/convites/{c_can['id']}/aceitar") == 422)

    for p, c in [(gestor, c_gestor), (membro, c_membro), (convidado, c_conv)]:
        s, b = p.req("POST", f"/convites/{c['id']}/aceitar")
        check(f"{p.email.split('.')[0]} aceita o convite", s == 200 and b["status"] == "ACEITO", f"HTTP {s} {detalhe(b)}")

    def acesso(p):
        _, me = p.req("GET", "/auth/me")
        o = next((o for o in me["organizacoes"] if o["id"] == org_id), None)
        return o, {x["id"]: x for x in (o["projetos"] if o else [])}

    o, ps = acesso(gestor)
    check("/me gestor: GESTOR na org, GESTOR nos 2 projetos (herança)",
          o["papel"] == "GESTOR" and all(x["papeis"] == ["GESTOR"] for x in ps.values()) and len(ps) == 2)
    o, ps = acesso(membro)
    check("/me membro: MEMBRO na org, STAKEHOLDER_TECNICO nos projetos",
          o["papel"] == "MEMBRO" and all(x["papeis"] == ["STAKEHOLDER_TECNICO"] for x in ps.values()))
    o, ps = acesso(convidado)
    check("/me convidado: sem papel na org, só o projeto A com técnico + cliente",
          o["papel"] is None and list(ps) == [pa] and sorted(ps[pa]["papeis"]) == ["STAKEHOLDER_CLIENTE", "STAKEHOLDER_TECNICO"])

    # ─────────────────────────────────────────────────────────────────────────
    secao("6. Multi-tenancy: listagens e acesso a organização/projeto")
    s, orgs = estranho.req("GET", "/organizacao")
    check("estranho não vê a organização na listagem", s == 200 and all(x["id"] != org_id for x in orgs))
    check("estranho GET organização → 403", estranho.status("GET", f"/organizacao/{org_id}") == 403)
    check("estranho GET projeto → 403", estranho.status("GET", f"/projeto/{pa}") == 403)
    s, lista = convidado.req("GET", f"/projeto/organizacao/{org_id}")
    check("convidado lista só o projeto em que está", s == 200 and [x["id"] for x in lista] == [pa], str(lista)[:120])
    check("convidado GET projeto B → 403", convidado.status("GET", f"/projeto/{pb}") == 403)
    s, lista = membro.req("GET", f"/projeto/organizacao/{org_id}")
    check("membro da org lista todos os projetos", s == 200 and len(lista) == 2)

    # ─────────────────────────────────────────────────────────────────────────
    secao("7. Organização e projeto: editar, criar, inativar")
    corpo_org = {"nome": f"Org E2E {SUF}", "descricao": "editada", "plano": "FREE"}
    check("gestor não edita a organização (só o dono) → 403", gestor.status("PUT", f"/organizacao/{org_id}", corpo_org) == 403)
    check("dono edita a organização → 200", dono.status("PUT", f"/organizacao/{org_id}", corpo_org) == 200)
    check("membro não cria projeto → 403",
          membro.status("POST", "/projeto", {"organizacaoId": org_id, "nome": f"X {SUF}", "descricao": "x"}) == 403)
    s, pg = gestor.req("POST", "/projeto", {"organizacaoId": org_id, "nome": f"Proj G {SUF}", "descricao": "x"})
    check("gestor da org cria projeto → 201", s == 201, f"HTTP {s} {detalhe(pg)}")
    _, ps = acesso(gestor)
    check("gestor vira DONO do projeto que criou", "DONO" in ps.get(pg["id"], {}).get("papeis", []))
    check("membro não inativa projeto → 403", membro.status("DELETE", f"/projeto/{pb}") == 403)
    check("gestor inativa projeto → 204", gestor.status("DELETE", f"/projeto/{pb}") == 204)
    check("gestor reativa projeto → 200", gestor.status("PATCH", f"/projeto/{pb}/ativar") == 200)
    check("membro não inativa a organização → 403", membro.status("DELETE", f"/organizacao/{org_id}") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("8. Módulos do projeto por papel (Fase 4)")
    s, req1 = dono.req("POST", f"/requisito/projeto/{pa}", {"titulo": "R1", "descricao": "d", "tipoRequisito": "FUNCIONAL"})
    s2, req2 = gestor.req("POST", f"/requisito/projeto/{pa}", {"titulo": "R2", "descricao": "d", "tipoRequisito": "FUNCIONAL"})
    check("dono e gestor criam requisitos", s == 201 and s2 == 201, f"{s}/{s2}")
    s, rb = dono.req("POST", f"/requisito/projeto/{pb}", {"titulo": "RB", "descricao": "d", "tipoRequisito": "FUNCIONAL"})
    check("código é sequencial por projeto (REQ-001 em A e em B)", req1["codigo"] == "REQ-001" and s == 201 and rb["codigo"] == "REQ-001",
          f"{req1.get('codigo')} / HTTP {s} {detalhe(rb)}")
    check("membro não cria requisito → 403",
          membro.status("POST", f"/requisito/projeto/{pa}", {"titulo": "X", "descricao": "d", "tipoRequisito": "FUNCIONAL"}) == 403)
    check("membro lista requisitos → 200", membro.status("GET", f"/requisito/projeto/{pa}") == 200)
    check("estranho lista requisitos → 403", estranho.status("GET", f"/requisito/projeto/{pa}") == 403)
    check("membro não edita requisito → 403", membro.status("PUT", f"/requisito/{req1['id']}", {"titulo": "Y"}) == 403)

    check("gestor cria critério de aceite → 201",
          gestor.status("POST", f"/criterio-aceite/requisito/{req1['id']}", {"nome": "C1", "descricao": "d"}) == 201)
    check("membro não cria critério → 403",
          membro.status("POST", f"/criterio-aceite/requisito/{req1['id']}", {"nome": "C2", "descricao": "d"}) == 403)
    check("gestor vincula requisitos → 201",
          gestor.status("POST", f"/vinculo-requisito/requisito/{req1['id']}", {"requisitoDestinoId": req2["id"], "tipo": "DEPENDE_DE"}) == 201)
    check("membro não vincula → 403",
          membro.status("POST", f"/vinculo-requisito/requisito/{req2['id']}", {"requisitoDestinoId": req1["id"], "tipo": "IMPACTA"}) == 403)
    check("membro vê a matriz de rastreabilidade → 200", membro.status("GET", f"/rastreabilidade/projeto/{pa}/matriz") == 200)

    s, com = membro.req("POST", "/comentario", {"conteudo": "oi", "entidadeTipo": "REQUISITO", "entidadeId": req1["id"],
                                                "projetoId": pb})
    check("membro comenta requisito; projeto vem da entidade (não do corpo)", s == 201 and com.get("projetoId") in (pa, None),
          f"HTTP {s} {detalhe(com)}")
    check("estranho não comenta → 403",
          estranho.status("POST", "/comentario", {"conteudo": "x", "entidadeTipo": "REQUISITO", "entidadeId": req1["id"], "projetoId": pa}) == 403)
    check("estranho não lista comentários → 403",
          estranho.status("GET", f"/comentario?entidadeTipo=REQUISITO&entidadeId={req1['id']}") == 403)
    check("listagem global de comentários só para admin → 403", dono.status("GET", "/comentario/todos") == 403)

    s, wiki = membro.req("GET", f"/projeto/{pa}/wiki")
    check("membro lê a wiki → 200", s == 200, f"HTTP {s}")
    check("membro não edita a wiki → 403", membro.status("PUT", f"/projeto/{pa}/wiki", {"objetivoGeral": "x"}) == 403)
    check("gestor edita a wiki → 200", gestor.status("PUT", f"/projeto/{pa}/wiki", {"objetivoGeral": "x"}) == 200)
    check("membro comenta a wiki → 201",
          membro.status("POST", "/comentario", {"conteudo": "w", "entidadeTipo": "WIKI_OBJETIVO", "entidadeId": wiki["id"]}) == 201)

    s, ent = gestor.req("POST", f"/entidade-dados/projeto/{pa}", {"nome": "Cliente", "descricao": "cliente; com separador"})
    check("gestor cria entidade do MER → 201", s == 201, f"HTTP {s} {detalhe(ent)}")
    check("membro não cria entidade → 403",
          membro.status("POST", f"/entidade-dados/projeto/{pa}", {"nome": "X", "descricao": "x"}) == 403)
    check("membro vê o diagrama → 200", membro.status("GET", f"/entidade-dados/projeto/{pa}/diagrama") == 200)

    s, arq = gestor.req("POST", f"/projects/{pa}/files/upload", multipart=("e2e.txt", b"conteudo e2e"))
    check("gestor envia arquivo → 201", s == 201, f"HTTP {s} {detalhe(arq)}")
    check("membro não envia arquivo → 403",
          membro.status("POST", f"/projects/{pa}/files/upload", multipart=("m.txt", b"x")) == 403)
    check("membro lista arquivos → 200", membro.status("GET", f"/projects/{pa}/files") == 200)
    s, conteudo = membro.req("GET", f"/files/{arq['id']}/download")
    check("membro baixa arquivo → 200", s == 200 and "conteudo e2e" in str(conteudo), f"HTTP {s}")
    check("membro não exclui arquivo → 403", membro.status("DELETE", f"/files/{arq['id']}") == 403)
    check("gestor exclui arquivo → 204", gestor.status("DELETE", f"/files/{arq['id']}") == 204)

    evento = {"nome": "Kickoff", "projetoId": pa, "organizacaoId": org_id, "dataHoraInicio": "2026-10-01T13:00:00Z"}
    s, ev = gestor.req("POST", "/evento", evento)
    check("gestor cria evento (já APROVADO) → 201", s == 201 and ev["status"] == "APROVADO", f"HTTP {s} {detalhe(ev)}")
    check("membro não cria evento direto → 403", membro.status("POST", "/evento", evento) == 403)
    check("evento com organização de outro projeto → 422/400",
          gestor.status("POST", "/evento", {**evento, "organizacaoId": str(uuid.uuid4())}) in (400, 404, 422))
    check("membro lista eventos → 200", membro.status("GET", f"/evento/projeto/{pa}") == 200)

    check("gestor vê auditoria do projeto → 200", gestor.status("GET", f"/auditoria/projeto/{pa}") == 200)
    check("membro não vê auditoria do projeto → 403", membro.status("GET", f"/auditoria/projeto/{pa}") == 403)
    check("membro vê histórico do requisito → 200",
          membro.status("GET", f"/auditoria?entidadeTipo=REQUISITO&entidadeId={req1['id']}") == 200)
    check("membro vê analytics → 200", membro.status("GET", f"/interacao/projeto/{pa}/resumo") == 200)
    check("estranho não vê analytics → 403", estranho.status("GET", f"/interacao/projeto/{pa}/resumo") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("9. Admin da Plataforma: dados de referência e listagens globais")
    admin = Pessoa("admin"); pessoas.append(admin)
    kc("PUT", f"/users/{admin.kc}/groups/{g_admin['id']}")
    admin.login()
    s, me = admin.req("GET", "/auth/me")
    check("/me do admin: adminPlataforma = true", s == 200 and me["adminPlataforma"] is True)
    novo_status = {"nome": f"E2E_{SUF}", "descricao": "e2e", "ordem": 900 + int(SUF[:2], 16)}
    check("dono não cria status de requisito → 403", dono.status("POST", "/status-requisito", novo_status) == 403)
    s, st = admin.req("POST", "/status-requisito", novo_status)
    check("admin cria status de requisito → 201", s == 201, f"HTTP {s} {detalhe(st)}")
    if s == 201: extras_status.append(st["id"])
    nova_prio = {"codigo": f"E2E_{SUF}", "nome": "E2E", "descricao": "e2e", "ordem": 900 + int(SUF[2:4], 16)}
    check("gestor não cria prioridade → 403", gestor.status("POST", "/prioridade", nova_prio) == 403)
    s, pr = admin.req("POST", "/prioridade", nova_prio)
    check("admin cria prioridade → 201", s == 201, f"HTTP {s} {detalhe(pr)}")
    if s == 201: extras_prioridade.append(pr["id"])
    check("admin lista comentários globais → 200", admin.status("GET", "/comentario/todos") == 200)
    check("admin não participa do projeto → 403 (admin não é superusuário de projetos)",
          admin.status("GET", f"/projeto/{pa}") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("10. Aprovação de requisito")
    s, sts = dono.req("GET", "/status-requisito")
    id_aprovado = next(x["id"] for x in sts if x["nome"] == "APROVADO")
    s, b = dono.req("PUT", f"/requisito/{req1['id']}", {"statusId": id_aprovado})
    check("PUT para APROVADO → 422 (só pelo endpoint de aprovação)", s == 422, f"HTTP {s}")
    check("stakeholder não aprova → 403", convidado.status("PATCH", f"/requisito/{req1['id']}/aprovar") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("11. Solicitações (D12)")
    base_sol = f"/projeto/{pa}/solicitacoes"
    check("técnico não pede aprovação (só cliente) → 403",
          membro.status("POST", base_sol, {"tipo": "APROVACAO_REQUISITO", "alvoId": req2["id"]}) == 403)
    s, sol_ap = convidado.req("POST", base_sol, {"tipo": "APROVACAO_REQUISITO", "alvoId": req2["id"], "justificativa": "pronto"})
    check("cliente pede aprovação → 201", s == 201, f"HTTP {s} {detalhe(sol_ap)}")
    check("alteração de requisito não aprovado → 422",
          membro.status("POST", base_sol, {"tipo": "ALTERACAO_REQUISITO", "alvoId": req1["id"]}) == 422)
    s, b = dono.req("PATCH", f"/requisito/{req1['id']}/aprovar")
    check("dono aprova pelo endpoint → 200", s == 200 and b["statusNome"] == "APROVADO" and b["aprovadoPorNome"], f"HTTP {s}")
    check("gestor (não stakeholder) não solicita → 403",
          gestor.status("POST", base_sol, {"tipo": "ALTERACAO_REQUISITO", "alvoId": req1["id"]}) == 403)
    s, sol = membro.req("POST", base_sol, {"tipo": "ALTERACAO_REQUISITO", "alvoId": req1["id"], "justificativa": "escopo"})
    check("técnico pede alteração de requisito aprovado → 201", s == 201 and sol["alvoDescricao"], f"HTTP {s} {detalhe(sol)}")
    check("pendente repetida → 409", membro.status("POST", base_sol, {"tipo": "ALTERACAO_REQUISITO", "alvoId": req1["id"]}) == 409)
    s, lista = membro.req("GET", base_sol)
    check("stakeholder lista só as próprias", s == 200 and [x["id"] for x in lista] == [sol["id"]])
    s, lista = gestor.req("GET", base_sol)
    check("gestor lista todas", s == 200 and len(lista) == 2)
    check("stakeholder não atende → 403", membro.status("POST", f"/solicitacoes/{sol['id']}/atender") == 403)
    check("dono não cancela a de outro → 403", dono.status("POST", f"/solicitacoes/{sol['id']}/cancelar") == 403)
    s, b = gestor.req("POST", f"/solicitacoes/{sol['id']}/atender", {"resposta": "ok"})
    check("gestor atende → ATENDIDA", s == 200 and b["status"] == "ATENDIDA" and b["resposta"] == "ok", f"HTTP {s}")
    s, b = dono.req("POST", f"/solicitacoes/{sol_ap['id']}/recusar", {"resposta": "falta critério"})
    check("dono recusa → RECUSADA", s == 200 and b["status"] == "RECUSADA", f"HTTP {s}")
    check("responder de novo → 422", dono.status("POST", f"/solicitacoes/{sol_ap['id']}/atender") == 422)

    # ─────────────────────────────────────────────────────────────────────────
    secao("12. Evento solicitado")
    pedido = {"tipo": "EVENTO", "evento": {"nome": "Reunião", "dataHoraInicio": "2026-10-02T13:00:00Z"}}
    check("stakeholder sem dados do evento → 422/400", convidado.status("POST", base_sol, {"tipo": "EVENTO"}) in (400, 422))
    s, ev_ok = convidado.req("POST", base_sol, pedido)
    _, ev_nao = convidado.req("POST", base_sol, pedido)
    _, ev_can = convidado.req("POST", base_sol, pedido)
    check("stakeholder solicita evento → 201", s == 201, f"HTTP {s} {detalhe(ev_ok)}")

    def status_evento(eid):
        _, evs = convidado.req("GET", f"/evento/projeto/{pa}")
        return next((e["status"] for e in evs if e["id"] == eid), None)

    check("evento nasce SOLICITADO", status_evento(ev_ok["alvoId"]) == "SOLICITADO")
    gestor.req("POST", f"/solicitacoes/{ev_ok['id']}/atender")
    gestor.req("POST", f"/solicitacoes/{ev_nao['id']}/recusar")
    convidado.req("POST", f"/solicitacoes/{ev_can['id']}/cancelar")
    check("atendida → evento APROVADO", status_evento(ev_ok["alvoId"]) == "APROVADO")
    check("recusada → evento REJEITADO", status_evento(ev_nao["alvoId"]) == "REJEITADO")
    check("cancelada → evento descartado", status_evento(ev_can["alvoId"]) is None)

    # ─────────────────────────────────────────────────────────────────────────
    secao("13. Exportação (D13)")
    s, csv = gestor.req("GET", f"/projeto/{pa}/exportar/mer")
    check("gestor exporta MER em CSV (BOM, ';', aspas)",
          s == 200 and csv.startswith("﻿entidade;") and '"cliente; com separador"' in csv, f"HTTP {s} {str(csv)[:60]}")
    s, csv = dono.req("GET", f"/projeto/{pa}/exportar/rastreabilidade")
    check("dono exporta rastreabilidade", s == 200 and "REQ-001" in csv, f"HTTP {s}")
    s, b = membro.req("GET", f"/projeto/{pa}/exportar/mer")
    check("stakeholder sem solicitação atendida → 403", s == 403 and "liberada" in detalhe(b), f"HTTP {s} {detalhe(b)}")
    check("estranho → 403", estranho.status("GET", f"/projeto/{pa}/exportar/mer") == 403)
    _, sx = membro.req("POST", base_sol, {"tipo": "EXPORT_MER"})
    gestor.req("POST", f"/solicitacoes/{sx['id']}/atender")
    s, csv = membro.req("GET", f"/projeto/{pa}/exportar/mer")
    check("após atendida, stakeholder exporta MER", s == 200 and "Cliente" in csv, f"HTTP {s}")
    check("…mas não a rastreabilidade (outro tipo)", membro.status("GET", f"/projeto/{pa}/exportar/rastreabilidade") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("14. Participantes: listar, promover, remover")
    s, parts = dono.req("GET", f"/projeto/{pa}/participantes")
    por_email = {p["email"]: p["vinculos"] for p in parts} if s == 200 else {}
    check("participantes do projeto A: dono, gestor, membro (herdados) e convidado (direto)",
          {dono.email, gestor.email, membro.email, convidado.email} <= set(por_email)
          and any(v["origem"] == "ORGANIZACAO" for v in por_email.get(membro.email, [])), json.dumps(por_email)[:200])
    check("convidado não lista membros da organização → 403", convidado.status("GET", f"/organizacao/{org_id}/membros") == 403)
    check("não remove papel herdado da org pelo projeto → 422", dono.status("DELETE", f"/projeto/{pa}/participantes/{membro.id}") == 422)
    check("dono do projeto não é removível → 422", dono.status("DELETE", f"/projeto/{pa}/participantes/{dono.id}") == 422)
    check("dono da organização não é removível → 422", dono.status("DELETE", f"/organizacao/{org_id}/membros/{dono.id}") == 422)
    check("gestor promove convidado a Gestor do projeto → 204",
          gestor.status("POST", f"/projeto/{pa}/participantes/{convidado.id}/promover") == 204)
    _, ps = acesso(convidado)
    check("convidado agora é GESTOR no projeto A (token renovado sozinho)", ps[pa]["papeis"] == ["GESTOR"], str(ps[pa]["papeis"]))
    check("promover de novo → 409", gestor.status("POST", f"/projeto/{pa}/participantes/{convidado.id}/promover") == 409)
    check("gestor não remove da organização (só o dono) → 403",
          gestor.status("DELETE", f"/organizacao/{org_id}/membros/{membro.id}") == 403)
    check("dono remove o convidado do projeto → 204", dono.status("DELETE", f"/projeto/{pa}/participantes/{convidado.id}") == 204)
    check("convidado removido perde acesso → 403", convidado.status("GET", f"/projeto/{pa}") == 403)
    check("dono remove membro da organização → 204", dono.status("DELETE", f"/organizacao/{org_id}/membros/{membro.id}") == 204)
    s, _, _ = membro.raw("GET", f"/projeto/{pa}")
    check("token do removido é revogado na hora → 401", s == 401, f"HTTP {s}")
    check("depois do refresh, sem acesso → 403", membro.status("GET", f"/projeto/{pa}") == 403)

    # ─────────────────────────────────────────────────────────────────────────
    secao("15. Contas de usuário")
    check("listagem global de usuários → 403 (não admin)", dono.status("GET", "/usuario") == 403)
    check("admin lista usuários → 200", admin.status("GET", "/usuario") == 200)
    check("usuário vê a própria conta → 200", dono.status("GET", f"/usuario/{dono.id}") == 200)
    check("não vê conta alheia → 403", dono.status("GET", f"/usuario/{gestor.id}") == 403)
    check("admin vê conta alheia → 200", admin.status("GET", f"/usuario/{gestor.id}") == 200)
    check("não inativa conta alheia → 403", estranho.status("DELETE", f"/usuario/{gestor.id}") == 403)
    check("admin inativa conta alheia → 204", admin.status("DELETE", f"/usuario/{convidado.id}") == 204)
    check("conta inativada não loga", convidado.login()[0] != 200)
    check("usuário inativa a própria conta → 204", estranho.status("DELETE", f"/usuario/{estranho.id}") == 204)
    check("…e não loga mais", estranho.login(SENHA_NOVA)[0] != 200)

    # ─────────────────────────────────────────────────────────────────────────
    secao("16. Logout")
    check("logout → 204", dono.status("POST", "/auth/logout") == 204)
    s, _, _ = dono.raw("POST", "/auth/refresh")
    check("refresh depois do logout → 401", s == 401, f"HTTP {s}")

except Exception as ex:
    import traceback
    traceback.print_exc()
    check("execução sem exceção", False, repr(ex))

finally:
    secao("Limpeza")
    try:
        if org_id:
            s, g = kc("GET", f"/group-by-path/org-{org_id}")
            if s == 200:
                print("  grupos Keycloak:", kc("DELETE", f"/groups/{g['id']}")[0])
        for p in pessoas:
            kc("DELETE", f"/users/{p.kc}")
        print(f"  usuários Keycloak removidos: {len(pessoas)}")
    except Exception as ex:
        print("  falha na limpeza do Keycloak:", ex)

    if org_id:
        projetos = f"(select id from projeto where organizacao_id='{org_id}')"
        requisitos = f"(select id from requisito where projeto_id in {projetos})"
        entidades = f"(select id from entidade_dados where projeto_id in {projetos})"
        sql = f"""
            delete from solicitacao where projeto_id in {projetos};
            delete from evento where organizacao_id='{org_id}' or projeto_id in {projetos};
            delete from comentario where projeto_id in {projetos};
            delete from criterio_aceite where requisito_id in {requisitos};
            delete from vinculo_requisito where requisito_origem_id in {requisitos};
            delete from impacto_dados where requisito_id in {requisitos};
            delete from relacionamento_entidade where entidade_origem_id in {entidades} or entidade_destino_id in {entidades};
            delete from atributo_entidade where entidade_id in {entidades};
            delete from entidade_dados where projeto_id in {projetos};
            delete from arquivo_projeto where projeto_id in {projetos};
            delete from interacao where projeto_id in {projetos};
            delete from auditoria where organizacao_id='{org_id}' or projeto_id in {projetos};
            delete from requisito where projeto_id in {projetos};
            delete from visao_produto where projeto_id in {projetos};
            delete from convite where organizacao_id='{org_id}' or projeto_id in {projetos};
            delete from projeto where organizacao_id='{org_id}';
            delete from organizacao where id='{org_id}';"""
        print("  banco (organização):", psql(sql)[:200])
    for sid in extras_status:
        print("  status extra:", psql(f"delete from status_requisito where id='{sid}'"))
    for pid in extras_prioridade:
        print("  prioridade extra:", psql(f"delete from prioridade where id='{pid}'"))
    print("  banco (usuários):", psql(f"delete from usuario where email like '%.e2e.{SUF}@exemplo.com'"))

falhas = [n for n, ok in resultados if not ok]
print(f"\n{len(resultados) - len(falhas)}/{len(resultados)} verificações OK")
for n in falhas:
    print("  FALHOU:", n)
sys.exit(1 if falhas else 0)
