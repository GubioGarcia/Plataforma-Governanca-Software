#!/usr/bin/env bash
# Carrega o projeto de demonstração do TCC no ambiente hospedado. Roda NA VM:
#     ssh -t ... 'bash ~/plataforma/carregar_demo.sh'
#
# Não é destrutivo: cria as contas da demo (ou redefine a senha das que já
# existem), roda o seed idempotente e põe cada conta nos grupos da organização e
# do projeto. Nenhuma conta da demo é Admin da Plataforma (ver criar_admin.sh).
#
# A senha das contas é digitada no terminal (sem eco); "{nome}" vira o primeiro
# nome da pessoa. Não fica gravada na VM nem no repositório.
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ./.env; set +a

DEV_API_URL=http://127.0.0.1:8081/api \
DEV_KEYCLOAK_URL=http://127.0.0.1:8080 \
DEV_KC_ADMIN_USER="$KEYCLOAK_ADMIN" \
DEV_KC_ADMIN_PASS="$KEYCLOAK_ADMIN_PASSWORD" \
DEV_PG_USER="$POSTGRES_USER" \
DEV_PG_DB="$POSTGRES_DB" \
python3 scripts/carregar_demo.py
