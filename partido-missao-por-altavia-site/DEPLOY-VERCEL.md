# Guia de publicação — Partido Missão por Altávia

Este pacote contém o site completo do Partido Missão por Altávia (PMA):
Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma (SQLite).

## O que há no site

- Página inicial completa: logo, Quem somos, Programa Altávia 2027 (6 eixos, com a Sala Altávia),
  Liderança (Nikolas Brandão e Gabriel Augusto), Notícias com sub-páginas completas,
  aba Candidaturas com área do administrador, Filie-se e Contato.
- Notícias e estatísticas institucionais já embutidas no código — o site funciona
  em qualquer hospedagem, mesmo sem banco de dados configurado.
- Área do administrador (aba Candidaturas → "Área do administrador") para registrar, editar e
  excluir candidaturas. Senha padrão: **missao2027** (alterável pela variável ADMIN_PASSWORD).

## Como publicar na Vercel com o URL partidomissaoporaltavia.vercel.app

1. Acesse https://vercel.com e faça login na sua conta.
2. Clique em **Add New... → Project**.
3. Importe o repositório GitHub **missaoaltavia** (definindo `partido-missao-por-altavia-site`
   como Root Directory) — ou faça o upload desta pasta descompactada.
4. Clique em **Deploy** — **nenhuma variável de ambiente é necessária**.
5. Após o deploy, vá em **Settings → General → Change Project Name** e renomeie o projeto para:
   `partidomissaoporaltavia`
6. O site ficará disponível em **https://partidomissaoporaltavia.vercel.app**

Se o projeto Vercel já está conectado ao repositório GitHub `missaoaltavia`, basta enviar (push)
as alterações — a Vercel refaz o deploy automaticamente.

## Observações técnicas

- **Sem DATABASE_URL**, o site funciona em modo resiliente: notícias e estatísticas são lidas
  do conteúdo embutido (src/lib/site-data.ts), e os envios de formulários (filiação e contato)
  e as candidaturas geridas pelo administrador ficam em memória temporária da função serverless.
- **Com DATABASE_URL** (desenvolvimento local ou banco gerenciado), todas as leituras e escritas
  usam o Prisma normalmente.
- Para registros permanentes em produção, recomenda-se migrar o banco para um serviço
  gerenciado (ex.: Turso, Supabase ou Neon) — basta definir a DATABASE_URL e ajustar o
  provider no prisma/schema.prisma.
- Para rodar localmente: `bun install`, copie `.env.example` para `.env`, rode
  `bun scripts/seed-pma.ts` (se quiser resetar os dados) e `bun run dev`.
