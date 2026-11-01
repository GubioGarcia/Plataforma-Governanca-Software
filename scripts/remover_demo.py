"""
Remove o projeto de demonstração do TCC sem tocar no resto da plataforma:
  1. no Keycloak, o grupo da organização da demo (/org-{fatesg}, com os subgrupos
     do projeto) e as contas da demo;
  2. no banco, tudo o que pertence à organização da demo e aos projetos dela —
     inclusive o que foi criado depois da carga, não só as linhas do seed;
  3. as contas da demo na tabela usuario. Se uma delas ainda for referenciada fora
     da demo (por exemplo, criou outra organização), fica inativa em vez de apagada;
  4. os arquivos enviados aos projetos da demo.

Uso (exige --confirmar):
    local:  py scripts/remover_demo.py --confirmar
    na VM:  bash ~/plataforma/remover_demo.sh --confirmar
"""
import sys

from demo_comum import A, BACKEND, ORG, PESSOAS, chamar, docker, grupo, passo, psql, psql_script, token_admin, usuario_keycloak

EMAILS = ", ".join(f"'{e}'" for e in PESSOAS)

# Ordem respeita as FKs. P = projetos da organização da demo; R = requisitos e
# E = entidades de dados desses projetos.
REMOCAO = f"""
BEGIN;
CREATE TEMP TABLE p ON COMMIT DROP AS SELECT id FROM projeto WHERE organizacao_id = '{ORG}';
CREATE TEMP TABLE r ON COMMIT DROP AS SELECT id FROM requisito WHERE projeto_id IN (SELECT id FROM p);
CREATE TEMP TABLE e ON COMMIT DROP AS SELECT id FROM entidade_dados WHERE projeto_id IN (SELECT id FROM p);

DELETE FROM impacto_dados WHERE requisito_id IN (SELECT id FROM r) OR entidade_id IN (SELECT id FROM e)
    OR atributo_id IN (SELECT id FROM atributo_entidade WHERE entidade_id IN (SELECT id FROM e));
DELETE FROM relacionamento_entidade WHERE entidade_origem_id IN (SELECT id FROM e) OR entidade_destino_id IN (SELECT id FROM e);
DELETE FROM atributo_entidade WHERE entidade_id IN (SELECT id FROM e) OR entidade_referenciada_id IN (SELECT id FROM e);
DELETE FROM entidade_dados WHERE id IN (SELECT id FROM e);
DELETE FROM vinculo_requisito WHERE requisito_origem_id IN (SELECT id FROM r) OR requisito_destino_id IN (SELECT id FROM r);
DELETE FROM criterio_aceite WHERE requisito_id IN (SELECT id FROM r);
DELETE FROM requisito WHERE id IN (SELECT id FROM r);
DELETE FROM solicitacao WHERE projeto_id IN (SELECT id FROM p);
DELETE FROM interacao WHERE projeto_id IN (SELECT id FROM p);
DELETE FROM visao_produto WHERE projeto_id IN (SELECT id FROM p);
DELETE FROM comentario WHERE projeto_id IN (SELECT id FROM p) OR organizacao_id = '{ORG}';
DELETE FROM evento WHERE projeto_id IN (SELECT id FROM p) OR organizacao_id = '{ORG}';
DELETE FROM arquivo_projeto WHERE projeto_id IN (SELECT id FROM p) OR organization_id = '{ORG}';
DELETE FROM convite WHERE projeto_id IN (SELECT id FROM p) OR organizacao_id = '{ORG}';
DELETE FROM auditoria WHERE projeto_id IN (SELECT id FROM p) OR organizacao_id = '{ORG}';
DELETE FROM projeto WHERE id IN (SELECT id FROM p);
DELETE FROM organizacao WHERE id = '{ORG}';

DO $$
DECLARE u record;
BEGIN
    FOR u IN SELECT id FROM usuario WHERE email IN ({EMAILS}) LOOP
        BEGIN
            DELETE FROM usuario WHERE id = u.id;
        EXCEPTION WHEN foreign_key_violation THEN
            UPDATE usuario SET ativo = FALSE, external_identity_id = NULL WHERE id = u.id;
            RAISE NOTICE 'conta % referenciada fora da demo: ficou inativa', u.id;
        END;
    END LOOP;
END $$;
COMMIT;
"""


def main():
    if "--confirmar" not in sys.argv:
        sys.exit(__doc__ + "\nNada foi feito: rode de novo com --confirmar.")

    passo("1. Keycloak: grupo da organização e contas da demo")
    t = token_admin()
    g = grupo(t, f"/org-{ORG}")
    if g:
        chamar("DELETE", f"{A}/groups/{g['id']}", token=t)
    print(f"   grupo da organização: {'removido' if g else 'não existia'}")
    for email in PESSOAS:
        kc_id = usuario_keycloak(t, email)
        if kc_id:
            chamar("DELETE", f"{A}/users/{kc_id}", token=t)
        print(f"   {email:<34} {'removida' if kc_id else 'não existia'}")

    passo("2. Banco: organização, projetos e contas da demo")
    psql_script(REMOCAO)
    print("   organizações da demo restantes:", psql(f"SELECT count(*) FROM organizacao WHERE id = '{ORG}'"),
          "| contas da demo restantes:", psql(f"SELECT count(*) FROM usuario WHERE email IN ({EMAILS})"))

    passo("3. Arquivos enviados aos projetos da demo")
    docker("exec", BACKEND, "rm", "-rf", f"/files/organizations/{ORG}")
    print("   pasta da organização removida")

    print("\nDemo removida.")


if __name__ == "__main__":
    main()
