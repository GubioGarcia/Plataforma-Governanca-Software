-- =============================================================================
-- V6 — Pesquisa do TCC: marcação de uso prévio
--
-- O "antes" mede a prática atual e só vale se o participante ainda não usou a
-- plataforma. Como ele pode ser adiado ("Responder depois") e quem é promovido
-- de Stakeholder a Gestor só o recebe na promoção, ao gravar o "antes" o
-- servidor registra se o usuário já tinha interações (tabela interacao, em
-- qualquer projeto). A análise usa a marcação para separar ou excluir essas
-- respostas. É um dado derivado, não uma pergunta: o instrumento v1 não muda.
--
-- Nula enquanto o "antes" não foi respondido e nas participações retiradas.
-- Só aditiva: não exige recriar o banco.
-- =============================================================================

ALTER TABLE pesquisa_participacao ADD COLUMN usou_plataforma_antes BOOLEAN;

-- Participações que já responderam o "antes" antes desta migration: a marcação
-- é calculada pelas interações anteriores ao envio do "antes".
UPDATE pesquisa_participacao p
SET usou_plataforma_antes = EXISTS (
        SELECT 1
        FROM interacao i
        WHERE i.usuario_id = p.usuario_id
          AND i.data_interacao < r.respondida_em)
FROM pesquisa_resposta r
WHERE r.participacao_id = p.id
  AND r.etapa = 'ANTES'
  AND p.situacao = 'PARTICIPANDO';
