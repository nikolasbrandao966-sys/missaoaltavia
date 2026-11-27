# Guia de publicação — Partido Missão por Altávia

Este pacote contém o site completo do Partido Missão por Altávia (PMA):
Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma (SQLite).

## O que há no site

- Página inicial completa: logo, Quem somos, Programa Altávia 2027 (6 eixos, com a Sala Altávia),
  Liderança (Nikolas Brandão e Gabriel Augusto), Notícias com sub-páginas completas,
  aba Candidaturas com área do administrador, Filie-se e Contato.
- Banco de dados já populado com as notícias do partido.
- Área do administrador (aba Candidaturas → "Área do administrador") para registrar, editar e
  excluir candidaturas. Senha padrão: **missao2027** (alterável pela variável ADMIN_PASSWORD).

## Como publicar na Vercel com o URL partidomissaoporaltavia.vercel.app

1. Acesse https://vercel.com e faça login na sua conta.
2. Clique em **Add New... → Project**.
3. Importe este projeto (faça upload da pasta descompactada ou suba-a para um repositório GitHub
   e conecte o repositório).
4. Na configuração de deploy, defina a variável de ambiente:
   - `DATABASE_URL` = `file:../db/custom.db`
   - (Opcional) `ADMIN_PASSWORD` = a senha oficial do administrador do partido.
5. Clique em **Deploy** e aguarde o build (Next.js é detectado automaticamente).
6. Após o deploy, vá em **Settings → General → Change Project Name** e renomeie o projeto para:
   `partidomissaoporaltavia`
7. O site ficará disponível em **https://partidomissaoporaltavia.vercel.app**

## Observações técnicas

- O banco SQLite (db/custom.db) já vem populado e é incluído no deploy (configurado em
  next.config.ts → outputFileTracingIncludes).
- Em hospedagem serverless (como a Vercel), o sistema de arquivos é efêmero: formulários enviados
  (filiação/contato) gravam em memória temporária. Para registros permanentes, recomenda-se migrar
  o banco para um serviço gerenciado (ex.: Turso, Supabase ou Neon) — basta trocar a
  DATABASE_URL e o provider no prisma/schema.prisma.
- Para rodar localmente: `bun install`, copie `.env.example` para `.env`, rode
  `bun scripts/seed-pma.ts` (se quiser resetar os dados) e `bun run dev`.
