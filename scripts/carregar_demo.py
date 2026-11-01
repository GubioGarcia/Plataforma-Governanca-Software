"""
Carrega o projeto de demonstração do TCC (scripts/seed_tcc_projeto_demo.sql) sem
apagar nada: cria as contas da demo no Keycloak (ou redefine a senha das que já
existem), roda o seed idempotente e põe cada pessoa nos grupos da organização e
do projeto. Nenhuma conta da demo é Admin da Plataforma.

Se a organização ou o projeto da demo ainda não têm grupo no Keycloak, o backend
é reiniciado uma vez (a migração de grupos roda na inicialização).

Uso:
    local:  py scripts/carregar_demo.py
    na VM:  bash ~/plataforma/carregar_demo.sh

A senha das contas vem de DEV_SENHA_DEMO ou é digitada no terminal; "{nome}" vira
o primeiro nome da pessoa (ex.: "Demo@{nome}2026"). Ver demo_comum.py.
"""
from demo_comum import carregar_demo, senha_demo

if __name__ == "__main__":
    carregar_demo(senha_demo())
