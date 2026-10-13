# Imagem do frontend no ambiente hospedado: serve o dist/ já gerado por
# publicar.sh (npm run build com VITE_API_URL=/api).
FROM nginx:alpine

COPY dist /usr/share/nginx/html

# Garante que o React Router funcione em recargas de página (SPA fallback)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    server_tokens off;\n\
    location / {\n\
    try_files $uri $uri/ /index.html;\n\
    }\n\
    }\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
