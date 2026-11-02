#!/usr/bin/env bash
# Sobe ou atualiza o ambiente hospedado. Roda NA VM, em ~/plataforma
# (o publicar.sh envia os arquivos e chama este script).
#
#  1. Na primeira vez, gera o .env com senhas aleatórias (PostgreSQL, admin do
#     Keycloak e client secrets). As senhas nascem aqui, nunca são impressas e
#     não saem da VM. Para consultar: cat ~/plataforma/.env
#  2. Grava o realm-export.prod.json com os client secrets do .env (os do
#     realm-export.json versionado são públicos e não valem aqui).
#  3. Obtém o certificado HTTPS do Let's Encrypt, se ainda não existir. A
#     renovação é automática (certbot.timer), parando o nginx por alguns segundos.
#  4. docker compose up e espera o backend responder.
set -euo pipefail
cd "$(dirname "$0")"
umask 077
chmod 700 .

# ── 1. Segredos ────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  : "${DOMINIO:?informe DOMINIO na primeira publicação}"
  gerar() { openssl rand -hex 24; }
  {
    echo "DOMINIO=${DOMINIO}"
    echo "POSTGRES_DB=plataforma"
    echo "POSTGRES_USER=plataforma"
    echo "POSTGRES_PASSWORD=$(gerar)"
    echo "KEYCLOAK_DB=keycloak"
    echo "KEYCLOAK_ADMIN=admin"
    echo "KEYCLOAK_ADMIN_PASSWORD=$(gerar)"
    echo "KEYCLOAK_CLIENT_SECRET=$(gerar)"
    echo "KEYCLOAK_ADMIN_CLIENT_SECRET=$(gerar)"
  } > .env
  echo "[subir] .env criado com senhas novas (consulte com: cat ~/plataforma/.env)"
fi
chmod 600 .env
set -a; . ./.env; set +a

# ── 2. Realm com os client secrets da VM ───────────────────────────────────────
sed -e "s/\"plataforma-api-secret\"/\"${KEYCLOAK_CLIENT_SECRET}\"/" \
    -e "s/\"plataforma-admin-secret\"/\"${KEYCLOAK_ADMIN_CLIENT_SECRET}\"/" \
    keycloak/realm-export.json > keycloak/realm-export.prod.json
if grep -qE '"plataforma-(api|admin)-secret"' keycloak/realm-export.prod.json; then
  echo "[subir] ERRO: os client secrets não foram substituídos no realm." >&2; exit 1
fi
# legível pelo usuário do container do Keycloak; a pasta (700) protege dos demais
chmod 644 keycloak/realm-export.prod.json

# ── 3. Certificado HTTPS ───────────────────────────────────────────────────────
if ! sudo test -f "/etc/letsencrypt/live/${DOMINIO}/fullchain.pem"; then
  command -v certbot >/dev/null || { sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot >/dev/null; }
  docker stop nginx >/dev/null 2>&1 || true
  sudo certbot certonly --standalone -d "${DOMINIO}" --non-interactive --agree-tos \
    --register-unsafely-without-email \
    --pre-hook "docker stop nginx || true" --post-hook "docker start nginx || true"
fi

# ── 4. Containers ──────────────────────────────────────────────────────────────
docker compose up -d --build --remove-orphans
# o template do nginx só é aplicado na partida do container (mudança no arquivo não o recria)
docker compose restart nginx

echo "[subir] aguardando o backend (o Keycloak demora alguns minutos nesta VM)..."
for _ in $(seq 1 120); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8081/api/organizacao)" = "401" ]; then
    docker compose ps --format 'table {{.Name}}\t{{.Status}}'
    echo "[subir] pronto: https://${DOMINIO}"
    exit 0
  fi
  sleep 5
done
echo "[subir] o backend não respondeu em 10 min — veja: docker compose logs --tail 80 backend keycloak" >&2
exit 1
