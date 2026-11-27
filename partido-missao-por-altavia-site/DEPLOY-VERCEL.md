# Guia de publicação — Partido Missão por Altávia

Este pacote contém o site completo do Partido Missão por Altávia (PMA):
Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma.

## O que há no site

- Página inicial completa: logo, Quem somos, Programa Altávia 2027 (6 eixos, com a Sala Altávia),
  Liderança (Nikolas Brandão e Gabriel Augusto), Notícias com sub-páginas completas,
  aba Candidaturas, Filie-se e Contato.
- **Painel do administrador** em **/admin** (também pelo link "Administração" no rodapé ou
  "Área do administrador" na aba Candidaturas), com senha. Nele a Direção Nacional pode:
  - **publicar, editar, despublicar e excluir notícias** (cada notícia publicada ganha
    página completa própria na aba Notícias do site, com resumo, categoria e busca);
  - registrar, editar e excluir **candidaturas**;
  - acompanhar a lista de **filiados** recebidos pelo formulário Filie-se;
  - ler, marcar como lidas e excluir as **mensagens** do formulário de Contato;
  - ver o **painel** com contadores e o estado do banco de dados.
- Notícias e estatísticas institucionais já embutidas no código — o site público funciona
  em qualquer hospedagem, mesmo sem banco de dados configurado.

## Como publicar na Vercel com o URL partidomissaoporaltavia.vercel.app

1. Acesse https://vercel.com e faça login na sua conta.
2. Clique em **Add New... → Project**.
3. Importe o repositório GitHub **missaoaltavia** (definindo `partido-missao-por-altavia-site`
   como Root Directory) — ou faça o upload desta pasta descompactada.
4. Clique em **Deploy** — nenhuma variável de ambiente é obrigatória.
5. Após o deploy, vá em **Settings → General → Change Project Name** e renomeie o projeto para:
   `partidomissaoporaltavia`
6. O site ficará disponível em **https://partidomissaoporaltavia.vercel.app**

Se o projeto Vercel já está conectado ao repositório GitHub `missaoaltavia`, basta enviar (push)
as alterações — a Vercel refaz o deploy automaticamente.

## O painel do administrador

1. Abra **https://partidomissaoporaltavia.vercel.app/admin** (ou local: `http://localhost:3000/admin`).
2. Informe a senha do administrador. **Senha padrão: missao@2026**
   (veja abaixo como trocá-la).
3. Use as abas Painel, Notícias, Candidaturas, Filiados e Mensagens.
   A notícia criada em "Nova notícia" com "Publicada no site" ligada aparece imediatamente
   na aba Notícias do site público, com página completa própria.

## O que é permanente e o que é temporário

| Conteúdo | Sem banco configurado | Com DATABASE_URL |
| --- | --- | --- |
| Notícias, estatísticas e todo o conteúdo institucional | **Permanente** (embutido no código) | Permanente (banco) |
| Mensagens do formulário de Contato | Temporário* | Permanente (banco) |
| Filiados (formulário "Filie-se") | Temporário* | Permanente (banco) |
| Notícias e candidaturas geridas pelo painel | Temporário* | Permanente (banco) |

\* Temporário = fica na memória da hospedagem e pode ser perdido
em novos deploys. **As notícias institucionais nunca somem**: fazem parte do código do site.
Para que TUDO fique permanente, conecte um banco gratuito (seção abaixo) — 5 minutos.

## Como tornar tudo permanente (banco de dados grátis, sem editar código)

Com um banco PostgreSQL grátis (Neon ou Supabase), tudo o que você registra no painel —
notícias, candidaturas, filiados e mensagens — passa a ser gravado definitivamente.
O site se configura sozinho: não é preciso editar código, rodar migrations ou semear dados.
Passos com o Neon:

1. Crie uma conta grátis em https://neon.tech e crie um projeto.
2. Copie a **Connection String** (algo como
   `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb?sslmode=require`).
3. Na Vercel, abra **Settings → Environment Variables → Add New**:
   - **Name:** `DATABASE_URL`
   - **Value:** a connection string do passo 2
   - Marque os três ambientes: Production, Preview e Development
4. Em **Deployments**, abra o menu (⋮) do último deploy e clique em **Redeploy**.

O que acontece sozinho no redeploy: o provider do Prisma é ajustado para PostgreSQL,
o cliente é regenerado, as tabelas são criadas no banco e as notícias e estatísticas
institucionais são sincronizadas. A partir daí o painel mostra "Banco conectado —
registros permanentes" e tudo fica gravado.

## Como alterar a senha do administrador

A senha padrão é **missao@2026**. Para usar outra senha na versão publicada:

1. Na Vercel, abra **Settings → Environment Variables → Add New**:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** a nova senha (marque os três ambientes)
2. Em **Deployments**, abra o menu (⋮) do último deploy e clique em **Redeploy**.

Localmente, basta definir `ADMIN_PASSWORD` no arquivo `.env`.

## Observações técnicas

- **Sem DATABASE_URL**, o site funciona em modo resiliente: notícias e estatísticas são lidas
  do conteúdo embutido (src/lib/site-data.ts) e os registros do painel ficam em memória
  temporária (veja a tabela acima).
- **Com DATABASE_URL** (SQLite local ou Postgres na Vercel), todas as leituras e escritas
  usam o Prisma; tabelas e conteúdo institucional são criados/sincronizados automaticamente
  na primeira leitura.
- Para rodar localmente: `bun install`, copie `.env.example` para `.env`, rode
  `bun scripts/seed-pma.ts` (se quiser resetar os dados) e `bun run dev`.
