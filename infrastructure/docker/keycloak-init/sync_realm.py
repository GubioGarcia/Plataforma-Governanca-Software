"""
Sincroniza a configuracao de autorizacao do realm a partir do realm-export.json.

Motivo: o Keycloak so importa o realm-export.json quando o realm ainda nao existe
(--import-realm ignora realm ja criado). Este script aplica, de forma idempotente,
num realm que ja existe:
  - roles de realm (cria as ausentes, atualiza descricao, remove as obsoletas);
  - composites de cada role (deixa exatamente como no arquivo);
  - protocol mappers dos clients (cria ou atualiza pelo nome);
  - grupos de topo e suas roles de realm (cria os ausentes, adiciona roles faltantes).

Nao mexe em usuarios nem nos grupos de organizacao/projeto (criados pelo backend).

Uso: python3 sync_realm.py <caminho/realm-export.json>
Variaveis: KEYCLOAK_URL, KEYCLOAK_ADMIN, KEYCLOAK_ADMIN_PASSWORD
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak:8080")
ADMIN_USER = os.environ["KEYCLOAK_ADMIN"]
ADMIN_PASS = os.environ["KEYCLOAK_ADMIN_PASSWORD"]

# Roles que existiram em versoes anteriores do realm e devem ser removidas.
# ORG_ADMIN foi renomeada para ORG_MANAGER (decisao D4 do doc de autorizacao).
ROLES_OBSOLETAS = ["ORG_ADMIN"]


class KeycloakAdmin:
    def __init__(self, base_url, realm):
        self.base = base_url.rstrip("/")
        self.realm = realm
        self.token = self._obter_token()

    def _obter_token(self):
        body = urllib.parse.urlencode({
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": ADMIN_USER,
            "password": ADMIN_PASS,
        }).encode()
        req = urllib.request.Request(
            f"{self.base}/realms/master/protocol/openid-connect/token",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req) as res:
            return json.load(res)["access_token"]

    def call(self, method, path, body=None, ok_404=False):
        """Chama a Admin API do realm. Retorna o JSON (ou None). Com ok_404, 404 vira None."""
        url = f"{self.base}/admin/realms/{self.realm}{path}"
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        })
        try:
            with urllib.request.urlopen(req) as res:
                conteudo = res.read()
                return json.loads(conteudo) if conteudo else None
        except urllib.error.HTTPError as e:
            if ok_404 and e.code == 404:
                return None
            detalhe = e.read().decode(errors="replace")
            raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detalhe}") from e


def q(nome):
    return urllib.parse.quote(nome, safe="")


def sincronizar_roles(kc, roles_desejadas):
    existentes = {r["name"]: r for r in kc.call("GET", "/roles?first=0&max=10000&briefRepresentation=false")}

    for role in roles_desejadas:
        nome = role["name"]
        descricao = role.get("description", "")
        if nome not in existentes:
            kc.call("POST", "/roles", {"name": nome, "description": descricao})
            print(f"[sync] role criada: {nome}")
        elif (existentes[nome].get("description") or "") != descricao:
            kc.call("PUT", f"/roles/{q(nome)}", {"name": nome, "description": descricao})
            print(f"[sync] descricao atualizada: {nome}")

    for nome in ROLES_OBSOLETAS:
        if nome in existentes:
            kc.call("DELETE", f"/roles/{q(nome)}")
            print(f"[sync] role obsoleta removida: {nome}")

    # Recarrega para ter os ids das roles recem-criadas
    por_nome = {r["name"]: r for r in kc.call("GET", "/roles?first=0&max=10000")}

    for role in roles_desejadas:
        nome = role["name"]
        desejadas = set(role.get("composites", {}).get("realm", []))
        atuais = {r["name"] for r in kc.call("GET", f"/roles/{q(nome)}/composites/realm")}

        faltantes = desejadas - atuais
        sobrando = atuais - desejadas
        desconhecidas = [n for n in faltantes if n not in por_nome]
        if desconhecidas:
            raise RuntimeError(f"Composite de {nome} referencia roles inexistentes: {desconhecidas}")

        if faltantes:
            kc.call("POST", f"/roles/{q(nome)}/composites",
                    [{"id": por_nome[n]["id"], "name": n} for n in sorted(faltantes)])
            print(f"[sync] {nome}: composites adicionadas {sorted(faltantes)}")
        if sobrando:
            kc.call("DELETE", f"/roles/{q(nome)}/composites",
                    [{"id": por_nome[n]["id"], "name": n} for n in sorted(sobrando) if n in por_nome])
            print(f"[sync] {nome}: composites removidas {sorted(sobrando)}")

    return por_nome


def sincronizar_mappers(kc, clients):
    for client in clients:
        mappers = client.get("protocolMappers", [])
        if not mappers:
            continue
        encontrados = kc.call("GET", f"/clients?clientId={q(client['clientId'])}")
        if not encontrados:
            raise RuntimeError(f"Client {client['clientId']} nao encontrado no realm")
        client_uuid = encontrados[0]["id"]
        base = f"/clients/{client_uuid}/protocol-mappers/models"
        atuais = {m["name"]: m for m in kc.call("GET", base)}

        for mapper in mappers:
            atual = atuais.get(mapper["name"])
            if atual is None:
                kc.call("POST", base, mapper)
                print(f"[sync] mapper criado: {client['clientId']}/{mapper['name']}")
            elif atual.get("protocolMapper") != mapper["protocolMapper"] or atual.get("config") != mapper["config"]:
                kc.call("PUT", f"{base}/{atual['id']}", {**mapper, "id": atual["id"]})
                print(f"[sync] mapper atualizado: {client['clientId']}/{mapper['name']}")


def sincronizar_grupos(kc, grupos, roles_por_nome):
    for grupo in grupos:
        nome = grupo["name"]
        existente = kc.call("GET", f"/group-by-path/{q(nome)}", ok_404=True)
        if existente is None:
            kc.call("POST", "/groups", {"name": nome})
            existente = kc.call("GET", f"/group-by-path/{q(nome)}")
            print(f"[sync] grupo criado: /{nome}")

        desejadas = set(grupo.get("realmRoles", []))
        base = f"/groups/{existente['id']}/role-mappings/realm"
        atuais = {r["name"] for r in (kc.call("GET", base) or [])}
        faltantes = sorted(desejadas - atuais)
        if faltantes:
            kc.call("POST", base, [{"id": roles_por_nome[n]["id"], "name": n} for n in faltantes])
            print(f"[sync] grupo /{nome}: roles mapeadas {faltantes}")


def main():
    if len(sys.argv) != 2:
        print("Uso: sync_realm.py <realm-export.json>", file=sys.stderr)
        sys.exit(2)

    with open(sys.argv[1], encoding="utf-8") as f:
        config = json.load(f)

    kc = KeycloakAdmin(KEYCLOAK_URL, config["realm"])
    roles_por_nome = sincronizar_roles(kc, config.get("roles", {}).get("realm", []))
    sincronizar_mappers(kc, config.get("clients", []))
    sincronizar_grupos(kc, config.get("groups", []), roles_por_nome)
    print("[sync] realm sincronizado com o realm-export.json.")


if __name__ == "__main__":
    main()
