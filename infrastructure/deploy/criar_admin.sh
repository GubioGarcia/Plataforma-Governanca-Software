#!/usr/bin/env bash
# Cria a conta de Admin da Plataforma no ambiente hospedado. Roda NA VM:
#     ssh -t ... 'bash ~/plataforma/criar_admin.sh <email>'
#
# A senha é digitada no terminal (sem eco, com confirmação): não passa por
# argumento, variável de ambiente, arquivo nem log. Idempotente: se a conta já
# existe, só garante o grupo /_admin. É o único caminho para alguém virar Admin
# da Plataforma.
set -euo pipefail
cd "$(dirname "$0")"
[ $# -ge 1 ] || { echo "Uso: bash criar_admin.sh <email> [--nome \"Nome\"]" >&2; exit 1; }
set -a; . ./.env; set +a

DEV_API_URL=http://127.0.0.1:8081/api \
DEV_KEYCLOAK_URL=http://127.0.0.1:8080 \
DEV_KC_ADMIN_USER="$KEYCLOAK_ADMIN" \
DEV_KC_ADMIN_PASS="$KEYCLOAK_ADMIN_PASSWORD" \
DEV_PG_USER="$POSTGRES_USER" \
DEV_PG_DB="$POSTGRES_DB" \
python3 scripts/criar_admin.py "$@"
