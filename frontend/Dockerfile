# ── Estágio 1: build ──────────────────────────────────────────────────────────
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
ENV npm_config_optional=true

RUN npm install --include=optional

COPY . .

# Variáveis injetadas em tempo de build pelo Docker Compose
ARG VITE_API_URL=/api
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM

RUN npm run build

# ── Estágio 2: servir via nginx ────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Garante que o React Router funcione em recargas de página (SPA fallback)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
    try_files $uri $uri/ /index.html;\n\
    }\n\
    }\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80