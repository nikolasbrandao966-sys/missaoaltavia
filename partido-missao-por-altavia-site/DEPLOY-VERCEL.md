# Guia de publicação — Partido Missão por Altávia

Este pacote contém o site completo do Partido Missão por Altávia (PMA):
Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma —
com dados online persistentes no Firebase Realtime Database (projeto texnk-87824)
e Firebase Analytics.

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
- **Banco de dados online incluso (Firebase)**: sem configurar nada na Vercel, tudo o que
  é registrado no painel — notícias, candidaturas, filiados e mensagens — é gravado no
  Firebase Realtime Database (projeto texnk-87824, configuração em src/lib/firebase.ts)
  e sobrevive a novos deploys. Inclui **Firebase Analytics** para acompanhar as visitas
  no console do Firebase.

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

| Conteúdo | Padrão na Vercel (Firebase incluso) | Com DATABASE_URL (Neon/Supabase) |
| --- | --- | --- |
| Notícias, estatísticas e todo o conteúdo institucional | **Permanente** (código + Firebase) | Permanente (banco) |
| Mensagens do formulário de Contato | **Permanente (Firebase)** | Permanente (banco) |
| Filiados (formulário "Filie-se") | **Permanente (Firebase)** | Permanente (banco) |
| Notícias e candidaturas geridas pelo painel | **Permanente (Firebase)** | Permanente (banco) |

**As notícias institucionais nunca somem**: fazem parte do código do site.
O Firebase é usado automaticamente quando não há DATABASE_URL; se ele estiver
inacessível (ex.: rede fora), o site continua funcionando em modo temporário
em memória — nunca quebra.

## Como tornar tudo permanente

**Já está pronto:** sem configurar nada, o site grava notícias, candidaturas,
filiados e mensagens no Firebase Realtime Database do projeto texnk-87824.
Os dados ficam visíveis no [console do Firebase](https://console.firebase.google.com)
em **Realtime Database** (nó `pma`).

As chamadas ao banco são feitas apenas pelo servidor do site (rotas de API) —
a URL do banco não aparece no código enviado ao navegador — e a sincronização
do conteúdo institucional acontece sozinha na primeira leitura.

Preferir um banco PostgreSQL (Neon ou Supabase)? Com DATABASE_URL configurada,
o Prisma passa a ser usado no lugar do Firebase. Passos com o Neon:

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

- Ordem de prioridade da camada de dados (src/lib/data.ts):
  1. **DATABASE_URL configurada** (SQLite local ou Postgres na Vercel): todas as leituras
     e escritas usam o Prisma; tabelas e conteúdo institucional são criados/sincronizados
     automaticamente na primeira leitura;
  2. **Sem DATABASE_URL** (padrão no deploy da Vercel): Firebase Realtime Database
     (REST, chamado pelo servidor em src/lib/firebase-store.ts) — tudo persiste na nuvem
     e o painel mostra "Banco conectado — registros permanentes";
  3. **Firebase indisponível** (ex.: rede fora): modo em memória — o site nunca quebra.
- **Firebase Analytics** (measurementId G-EKQEZZP9JG) é carregado no layout via gtag.js —
  as visitas aparecem no console do Firebase, em Analytics.
- Para rodar localmente: `bun install`, copie `.env.example` para `.env`, rode
  `bun scripts/seed-pma.ts` (se quiser resetar os dados) e `bun run dev`.
  Para testar o modo Firebase localmente (sem Prisma): `bun scripts/test-firebase-mode.ts`.
