// Configuração do cliente Keycloak
// Em desenvolvimento (mock), o AuthContext usa dados locais
// Em produção, apontar para o servidor Keycloak real
export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'discovery-platform',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'discovery-frontend',
};
