#!/usr/bin/env bash
# Publica a plataforma na VM. Roda na máquina de desenvolvimento (Git Bash),
# na raiz do repositório:
#     bash infrastructure/deploy/publicar.sh            # compila e publica
#     bash infrastructure/deploy/publicar.sh --sem-build  # reaproveita jar e dist
#
#  1. compila o backend (jar) e o frontend (dist) aqui — a VM tem só 1 GB de RAM;
#  2. monta o pacote: compose, nginx, Dockerfiles, realm, keycloak-init e os
#     scripts da demo;
#  3. confere que os scripts da demo e os fontes do backend só têm e-mails
#     fictícios (@email.com) — aborta se aparecer outro;
#  4. envia para ~/plataforma na VM e roda o subir.sh lá.
#
# Nenhum segredo passa por aqui: as senhas são geradas e ficam só na VM.
#
# Variáveis opcionais: VM (ubuntu@129.148.55.171), CHAVE (~/.ssh/oracle_tcc),
# DOMINIO (129-148-55-171.sslip.io), JAVA_HOME (~/.jdks/ms-21.0.10).
set -euo pipefail

VM="${VM:-ubuntu@129.148.55.171}"
CHAVE="${CHAVE:-$HOME/.ssh/oracle_tcc}"
DOMINIO="${DOMINIO:-129-148-55-171.sslip.io}"
export JAVA_HOME="${JAVA_HOME:-$HOME/.jdks/ms-21.0.10}"

RAIZ="$(git rev-parse --show-toplevel)"
DEPLOY="$RAIZ/infrastructure/deploy"
BACKEND="$RAIZ/backend/plataforma-governanca-software"
FRONTEND="$RAIZ/frontend"

# ── 1. Build ───────────────────────────────────────────────────────────────────
if [ "${1:-}" != "--sem-build" ]; then
  echo "== backend: mvnw package"
  (cd "$BACKEND" && ./mvnw -q clean package -DskipTests)
  echo "== frontend: npm run build"
  # MSYS2_ENV_CONV_EXCL: sem isso o Git Bash converte "/api" em "C:/Program Files/Git/api"
  (cd "$FRONTEND" && { [ -d node_modules ] || npm ci; } && MSYS2_ENV_CONV_EXCL='*' VITE_API_URL=/api npm run build)
fi
if ! grep -rqF 'baseURL:"/api"' "$FRONTEND/dist/assets"; then
  echo "ERRO: o build do frontend não aponta a API para /api — veja baseURL em dist/assets." >&2; exit 1
fi
JAR="$(ls "$BACKEND"/target/*.jar | grep -v -- '-plain' | head -1)"
[ -f "$JAR" ] && [ -f "$FRONTEND/dist/index.html" ] || { echo "jar ou dist ausente: rode sem --sem-build" >&2; exit 1; }

# ── 2. Pacote ──────────────────────────────────────────────────────────────────
PACOTE="$(mktemp -d)"
trap 'rm -rf "$PACOTE"' EXIT
mkdir -p "$PACOTE"/{backend,frontend,nginx,keycloak,keycloak-init,postgres,scripts}

cp "$DEPLOY/docker-compose.prod.yml"            "$PACOTE/docker-compose.yml"
cp "$DEPLOY/subir.sh" "$DEPLOY/carregar_demo.sh" "$PACOTE/"
cp "$DEPLOY/nginx/default.conf.template"        "$PACOTE/nginx/"
cp "$DEPLOY/backend/Dockerfile" "$JAR"          "$PACOTE/backend/" && mv "$PACOTE/backend/$(basename "$JAR")" "$PACOTE/backend/app.jar"
cp "$DEPLOY/frontend/Dockerfile"                "$PACOTE/frontend/"
cp -r "$FRONTEND/dist"                          "$PACOTE/frontend/dist"
cp "$RAIZ/infrastructure/docker/keycloak/realm-export.json" "$PACOTE/keycloak/"
cp "$RAIZ/infrastructure/docker/keycloak-init/"*            "$PACOTE/keycloak-init/"
cp "$RAIZ/infrastructure/docker/postgres/init.sql"          "$PACOTE/postgres/"
cp "$RAIZ/scripts/recriar_ambiente_dev.py" "$RAIZ/scripts/seed_tcc_projeto_demo.sql" "$PACOTE/scripts/"

# finais de linha LF (checkout no Windows pode trazer CRLF)
find "$PACOTE" -maxdepth 2 -type f \( -name '*.sh' -o -name '*.yml' -o -name '*.template' -o -name '*.py' -o -name '*.sql' -o -name 'Dockerfile' \) \
  -exec sed -i 's/\r$//' {} +

# ── 3. Conferência: só e-mails fictícios (@email.com) ──────────────────────────
# $BACKEND/src/main são os fontes do app.jar
OUTROS="$(grep -rhoE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' "$PACOTE/scripts" "$BACKEND/src/main" | grep -v '@email\.com$' | sort -u || true)"
if [ -n "$OUTROS" ]; then
  echo "ERRO: e-mails não fictícios nos scripts da demo ou no backend — nada foi enviado: $OUTROS" >&2; exit 1
fi
echo "== pacote conferido: só e-mails fictícios"

# ── 4. Envio e subida ──────────────────────────────────────────────────────────
echo "== enviando para $VM:~/plataforma"
tar -czf - -C "$PACOTE" . | ssh -i "$CHAVE" "$VM" 'mkdir -p ~/plataforma && chmod 700 ~/plataforma && tar -xzf - -C ~/plataforma --no-same-owner'

echo "== subindo na VM"
ssh -i "$CHAVE" "$VM" "DOMINIO='$DOMINIO' bash ~/plataforma/subir.sh"
