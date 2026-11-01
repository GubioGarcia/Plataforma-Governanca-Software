#!/usr/bin/env bash
# Remove o projeto de demonstração do TCC do ambiente hospedado (organização,
# projeto, contas da demo e arquivos), sem tocar no resto. Roda NA VM:
#     bash ~/plataforma/remover_demo.sh --confirmar
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ./.env; set +a

DEV_API_URL=http://127.0.0.1:8081/api \
DEV_KEYCLOAK_URL=http://127.0.0.1:8080 \
DEV_KC_ADMIN_USER="$KEYCLOAK_ADMIN" \
DEV_KC_ADMIN_PASS="$KEYCLOAK_ADMIN_PASSWORD" \
DEV_PG_USER="$POSTGRES_USER" \
DEV_PG_DB="$POSTGRES_DB" \
python3 scripts/remover_demo.py "$@"
