# Hospedagem — Plataforma de Governança de Projetos de Software

Ambiente publicado em **https://129-148-55-171.sslip.io**, numa VM **Oracle Cloud Always Free** (VM.Standard.E2.1.Micro: 1 OCPU, 1 GB de RAM, Ubuntu 24.04, São Paulo).

O endereço usa o [sslip.io](https://sslip.io), que resolve `129-148-55-171.sslip.io` para o IP da VM. Assim dá para ter um certificado HTTPS do Let's Encrypt sem registrar domínio. Se o IP público mudar, troque o `DOMINIO` (veja [Trocar o IP ou o domínio](#trocar-o-ip-ou-o-domínio)).

---

## Arquitetura

```
internet ──443/80──► nginx ──┬── /            → frontend (nginx com o dist/)
                             ├── /api/        → backend (Spring Boot)
                             └── /swagger-ui/ → backend
                                                 │
                         rede interna Docker ────┼── keycloak (identidade, grupos)
                                                 └── postgres (bancos plataforma e keycloak)
```

- Só o nginx fica exposto à internet. O Keycloak e o backend escutam também em `127.0.0.1` da VM, para os scripts de manutenção, e o PostgreSQL não publica porta.
- A VM tem 1 GB de RAM, então nada é compilado nela: o jar e o `dist/` são gerados na máquina de quem publica, e a VM só monta imagens de runtime. As JVMs têm heap limitado (Keycloak 320 MB, backend 256 MB) e a VM tem 2 GB de swap.

| Arquivo | Função |
|---|---|
| `docker-compose.prod.yml` | Serviços do ambiente hospedado (vira `~/plataforma/docker-compose.yml` na VM) |
| `nginx/default.conf.template` | HTTPS, redirecionamento 80 → 443, proxy reverso, limite de requisições e cabeçalhos de segurança |
| `backend/Dockerfile`, `frontend/Dockerfile` | Imagens de runtime a partir do jar e do dist já compilados |
| `publicar.sh` | **Roda na sua máquina:** compila, monta o pacote, confere os e-mails, envia e sobe |
| `subir.sh` | **Roda na VM:** segredos, realm, certificado e `docker compose up` |
| `criar_admin.sh` | **Roda na VM:** cria a conta de Admin da Plataforma (senha digitada no terminal) |
| `carregar_demo.sh` | **Roda na VM:** carrega o projeto de demonstração do TCC (aditivo, não apaga nada) |
| `remover_demo.sh` | **Roda na VM:** remove só o projeto e as contas da demonstração |

---

## Segurança dos dados

### Senhas e segredos

As senhas do PostgreSQL e do admin do Keycloak, e os client secrets do Keycloak, são **geradas na própria VM** pelo `subir.sh` na primeira publicação (`openssl rand`, 192 bits). Elas ficam em `~/plataforma/.env`, com permissão `600`, numa pasta `700`.

- Não estão no git e não passam pela máquina de quem publica. Os scripts nunca as imprimem.
- Os client secrets do `realm-export.json` versionado são públicos, por isso não valem no ambiente hospedado: o `subir.sh` grava um `realm-export.prod.json` só na VM, com os secrets do `.env`.
- Para consultar uma senha (por exemplo, para abrir o console do Keycloak): `ssh ... 'cat ~/plataforma/.env'`.

> O `.env` é gerado uma única vez. Não o apague: o banco e o Keycloak já foram criados com essas senhas.

### Contas de pessoas

Nenhuma senha de conta fica no repositório nem nos scripts:

- **Admin da Plataforma:** conta própria, criada pelo `criar_admin.sh` com a senha digitada no terminal. É o único caminho para o grupo `/_admin`; nenhuma tela dá esse papel.
- **Contas da demonstração:** só têm papéis na organização e no projeto da demo, nunca de Admin. A senha é digitada na carga (`carregar_demo.sh`) e repassada à banca **fora do repositório**.
- As senhas usadas antes de nov/2026 estão no histórico do git. Por isso a demo foi recarregada com uma senha nova, e não só apagada do texto.

As contas da demo usam **e-mails fictícios** (`@email.com`), os mesmos do ambiente local. O `publicar.sh` **aborta o envio** se encontrar, nos scripts da demo ou nos fontes do backend, algum e-mail que não seja `@email.com`. Por isso o e-mail do admin é só argumento do `criar_admin.sh`, nunca escrito em arquivo.

### Proteções de acesso

- **Força bruta (Keycloak):** 5 senhas erradas seguidas bloqueiam a conta por 1 minuto, crescendo até 15 minutos. O login responde igual para senha errada, conta bloqueada e e-mail inexistente.
- **Política de senha:** mínimo de 8 caracteres e diferente do e-mail.
- **Limite de requisições (nginx, por IP):** login e cadastro a 20/min com rajada de 10; demais chamadas à API a 30/s com rajada de 60. O excesso recebe HTTP 429.
- **Cabeçalhos:** HSTS, CSP (`script-src 'self'`, sem scripts de terceiros), `X-Frame-Options: DENY`, `Permissions-Policy`, `nosniff` e `Referrer-Policy`. As exceções da CSP estão comentadas no template.
- **Swagger:** público até a banca (`SPRINGDOC_*_ENABLED=true` no `docker-compose.prod.yml`); trocar para `false` depois.
- **Dados de referência de sistema:** os status usados pelas regras não podem ser renomeados nem excluídos (HTTP 409).

---

## Preparar a VM (uma vez)

Depois de criar a VM e liberar as portas 80 e 443 na Security List da Oracle, rode na VM:

```bash
# Swap de 2 GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf && sudo sysctl --system

# Firewall da VM: as regras precisam ficar ANTES do REJECT.
sudo iptables -L INPUT -n --line-numbers   # anote a posição do REJECT (aqui era a 5)
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save

# Docker (repositório oficial)
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```

O certbot é instalado pelo `subir.sh` na primeira publicação.

---

## Publicar

Na raiz do repositório, no Git Bash, com a chave `~/.ssh/oracle_tcc`:

```bash
bash infrastructure/deploy/publicar.sh              # compila e publica
bash infrastructure/deploy/publicar.sh --sem-build  # reaproveita o jar e o dist já gerados
```

Requer JDK 21 (padrão `~/.jdks/ms-21.0.10`, ou defina `JAVA_HOME`) e Node. Os dados da VM (banco, arquivos, `.env` e certificado) são preservados entre publicações. Se o Keycloak precisar subir de novo, a publicação leva alguns minutos.

Um ambiente novo sobe **sem nenhuma conta, organização ou projeto**: só o schema e os dados de referência (migrations do Flyway).

### Conta de Admin da Plataforma

```bash
ssh -t -i ~/.ssh/oracle_tcc ubuntu@129.148.55.171 'bash ~/plataforma/criar_admin.sh <email-do-admin>'
```

A senha é pedida duas vezes, sem eco (o `-t` dá o terminal para isso). Se a conta já existe, o script só confere o grupo `/_admin`.

### Demonstração do TCC

```bash
# carrega (não apaga nada; pede a senha das contas — "{nome}" vira o primeiro nome)
ssh -t -i ~/.ssh/oracle_tcc ubuntu@129.148.55.171 'bash ~/plataforma/carregar_demo.sh'

# remove só a demo (organização, projeto, contas e arquivos)
ssh -i ~/.ssh/oracle_tcc ubuntu@129.148.55.171 'bash ~/plataforma/remover_demo.sh --confirmar'
```

Se a organização da demo ainda não tem grupo no Keycloak, a carga reinicia o backend uma vez (cerca de 2 minutos fora do ar).

---

## Operação

Na VM, em `~/plataforma`:

```bash
docker compose ps                          # estado dos serviços
docker compose logs --tail 100 -f backend  # logs
docker compose restart backend             # reiniciar um serviço
free -m                                    # memória e swap
```

**Console do Keycloak**, que não fica exposto: abra um túnel SSH e acesse `http://localhost:8080/admin` com o usuário `admin` e a senha `KEYCLOAK_ADMIN_PASSWORD` do `.env`:

```bash
ssh -i ~/.ssh/oracle_tcc -L 8080:127.0.0.1:8080 ubuntu@129.148.55.171
```

**Certificado:** o certbot renova sozinho (`certbot.timer`). Na renovação, o nginx fica parado por alguns segundos. Para testar: `sudo certbot renew --dry-run`.

### Trocar o IP ou o domínio

1. Edite `DOMINIO=` em `~/plataforma/.env` na VM (ex.: `1-2-3-4.sslip.io` ou um domínio próprio com registro A apontando para a VM).
2. Publique de novo: `DOMINIO=<novo> VM=ubuntu@<novo-ip> bash infrastructure/deploy/publicar.sh`. O `subir.sh` emite o certificado do domínio novo.
