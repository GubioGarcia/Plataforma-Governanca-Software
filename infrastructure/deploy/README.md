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
| `nginx/default.conf.template` | HTTPS, redirecionamento 80 → 443 e proxy reverso |
| `backend/Dockerfile`, `frontend/Dockerfile` | Imagens de runtime a partir do jar e do dist já compilados |
| `publicar.sh` | **Roda na sua máquina:** compila, monta o pacote, confere os e-mails, envia e sobe |
| `subir.sh` | **Roda na VM:** segredos, realm, certificado e `docker compose up` |
| `carregar_demo.sh` | **Roda na VM:** carrega o projeto de demonstração do TCC (destrutivo) |

---

## Segurança dos dados

### Senhas e segredos

As senhas do PostgreSQL e do admin do Keycloak, e os client secrets do Keycloak, são **geradas na própria VM** pelo `subir.sh` na primeira publicação (`openssl rand`, 192 bits). Elas ficam em `~/plataforma/.env`, com permissão `600`, numa pasta `700`.

- Não estão no git e não passam pela máquina de quem publica. Os scripts nunca as imprimem.
- Os client secrets do `realm-export.json` versionado são públicos, por isso não valem no ambiente hospedado: o `subir.sh` grava um `realm-export.prod.json` só na VM, com os secrets do `.env`.
- Para consultar uma senha (por exemplo, para abrir o console do Keycloak): `ssh ... 'cat ~/plataforma/.env'`.

> O `.env` é gerado uma única vez. Não o apague: o banco e o Keycloak já foram criados com essas senhas.

### E-mails da demonstração

As contas da demo usam **e-mails fictícios**, os mesmos do ambiente local (o seed e o `recriar_ambiente_dev.py` são compartilhados). O `publicar.sh` **aborta o envio** se encontrar, nos scripts da demo ou nos fontes do backend, algum e-mail que não seja `@email.com`:

| Conta | Papel | Senha |
|---|---|---|
| gubio@email.com | Dono da organização e do projeto + Admin da Plataforma | `TCC@Gubio2026` |
| luizfernando@email.com | Gestor da organização | `TCC@Luiz2026` |
| thiago@email.com | Gestor da organização | `TCC@Thiago2026` |
| plinio@email.com | Stakeholder Técnico + Cliente do projeto | `TCC@Plinio2026` |

A senha segue o padrão `TCC@<PrimeiroNome>2026`, com o primeiro nome sem acento.

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

### Carregar a demonstração

> ⚠️ **Destrutivo:** apaga o banco da aplicação e todos os usuários do realm antes de carregar.

```bash
ssh -i ~/.ssh/oracle_tcc ubuntu@129.148.55.171 'bash ~/plataforma/carregar_demo.sh --confirmar'
```

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
