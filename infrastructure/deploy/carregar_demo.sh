#!/usr/bin/env bash
# Carrega o projeto de demonstração do TCC no ambiente hospedado. Roda NA VM:
#     bash ~/plataforma/carregar_demo.sh --confirmar
#
# DESTRUTIVO: usa scripts/recriar_ambiente_dev.py, que apaga o banco da
# aplicação e todos os usuários do realm antes de carregar a demo.
#
# O seed e o script são os mesmos do ambiente local (e-mails fictícios).
# Senha das contas: TCC@<PrimeiroNome>2026 (ex.: TCC@Gubio2026), padrão do
# script; para outra, defina DEV_SENHA_DEMO, onde {nome} vira o primeiro nome.
set -euo pipefail
cd "$(dirname "$0")"

if [ "${1:-}" != "--confirmar" ]; then
  echo "Apaga os dados da aplicação e carrega a demo. Rode com --confirmar." >&2
  exit 1
fi

set -a; . ./.env; set +a

DEV_API_URL=http://127.0.0.1:8081/api \
DEV_KEYCLOAK_URL=http://127.0.0.1:8080 \
DEV_KC_ADMIN_USER="$KEYCLOAK_ADMIN" \
DEV_KC_ADMIN_PASS="$KEYCLOAK_ADMIN_PASSWORD" \
DEV_PG_USER="$POSTGRES_USER" \
DEV_PG_DB="$POSTGRES_DB" \
python3 scripts/recriar_ambiente_dev.py --confirmar
