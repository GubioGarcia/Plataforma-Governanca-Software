#!/bin/bash
set -e

KEYCLOAK_URL="http://keycloak:8080"
REALM="plataforma_discovery"
ADMIN_USER="${KEYCLOAK_ADMIN}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD}"
CLIENT_ID="plataforma-admin-client"

echo "[init] Aguardando Keycloak ficar disponivel..."
until curl -sf "${KEYCLOAK_URL}/realms/master" > /dev/null 2>&1; do
  sleep 3
done
echo "[init] Keycloak disponivel."

# 1. Obter token admin do realm master
echo "[init] Obtendo token admin..."
TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASS}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

echo "[init] Token obtido."

# 2. Buscar o ID interno do client plataforma-admin-client
echo "[init] Buscando ID interno do client '${CLIENT_ID}'..."
CLIENT_UUID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "import json,sys; clients=json.load(sys.stdin); print(clients[0]['id']) if clients else exit(1)")

echo "[init] Client UUID: ${CLIENT_UUID}"

# 3. Buscar o ID da service account do client (usuário service-account-*)
echo "[init] Buscando service account do client..."
SA_USER_ID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/service-account-user" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

echo "[init] Service Account User ID: ${SA_USER_ID}"

# 4. Buscar o ID interno do client realm-management
echo "[init] Buscando ID do client 'realm-management'..."
RM_CLIENT_UUID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=realm-management" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "import json,sys; clients=json.load(sys.stdin); print(clients[0]['id']) if clients else exit(1)")

echo "[init] realm-management UUID: ${RM_CLIENT_UUID}"

# 5. Buscar as roles manage-users, view-users e query-users do realm-management
echo "[init] Buscando roles do realm-management..."
ROLES_JSON=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${RM_CLIENT_UUID}/roles" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "
import json,sys
roles = json.load(sys.stdin)
needed = ['manage-users', 'view-users', 'query-users']
filtered = [r for r in roles if r['name'] in needed]
print(json.dumps(filtered))
")

echo "[init] Roles encontradas: $(echo $ROLES_JSON | python3 -c "import json,sys; print([r['name'] for r in json.load(sys.stdin)])")"

# 6. Verificar se as roles já estão atribuídas (idempotência)
echo "[init] Verificando roles já atribuídas..."
EXISTING=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${SA_USER_ID}/role-mappings/clients/${RM_CLIENT_UUID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "import json,sys; print([r['name'] for r in json.load(sys.stdin)])")

echo "[init] Roles já atribuídas: ${EXISTING}"

# 7. Atribuir as roles à service account
echo "[init] Atribuindo roles manage-users, view-users e query-users ao plataforma-admin-client..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${SA_USER_ID}/role-mappings/clients/${RM_CLIENT_UUID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${ROLES_JSON}")

if [ "$HTTP_STATUS" = "204" ] || [ "$HTTP_STATUS" = "200" ]; then
  echo "[init] Roles atribuídas com sucesso (HTTP ${HTTP_STATUS})."
else
  echo "[init] AVISO: HTTP ${HTTP_STATUS} ao atribuir roles. Podem já estar atribuídas."
fi

echo "[init] Inicializacao do Keycloak concluida com sucesso."