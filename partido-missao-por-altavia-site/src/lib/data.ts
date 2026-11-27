// Camada de dados — Partido Missão por Altávia (PMA)
//
// Estratégia de resiliência:
// - Com DATABASE_URL configurada (SQLite no desenvolvimento local ou um banco
//   gerenciado como Neon/Supabase em produção): todas as leituras e escritas
//   usam o Prisma — os registros são permanentes. Na primeira leitura, as
//   tabelas são criadas caso não existam e o conteúdo institucional embutido
//   (notícias e estatísticas) é sincronizado para o banco uma única vez,
//   controlado por um marcador em PartyStat.
// - Sem DATABASE_URL (ex.: deploy na Vercel sem variáveis de ambiente):
//   as leituras combinam o conteúdo institucional embutido (site-data.ts) com
//   o que for publicado pela área do administrador em memória; as escritas
//   também ficam em memória — o site nunca quebra com erro de banco.
import { Prisma } from '@prisma/client'
import { getDb } from '@/lib/db'
import {
  FALLBACK_NEWS,
  FALLBACK_STATS,
  type SiteCandidacy,
  type SiteNewsPost,
} from '@/lib/site-data'

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

export type NewsFilter = {
  category?: string
  q?: string
  excludeSlug?: string
  take?: number
}

export type NewContactMessage = {
  name: string
  email: string
  subject: string
  message: string
}

export type NewMember = {
  fullName: string
  email: string
  phone: string | null
  city: string
  region: string
  birthYear: number | null
  motivation: string | null
}

export type NewCandidacy = {
  position: string
  election: string
  candidate: string
  slogan: string | null
  proposal: string | null
  status: string
}

// Notícia com estado de publicação (usada pela área do administrador)
export type AdminNewsPost = SiteNewsPost & { published: boolean }

export type NewNewsPost = {
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  published: boolean
}

export type NewsUpdate = Partial<NewNewsPost> & { publishedAt?: Date }

// Listas para a área do administrador
export type AdminMember = NewMember & { id: string; createdAt: Date }

export type AdminContactMessage = NewContactMessage & {
  id: string
  createdAt: Date
  read: boolean
}

export type Overview = {
  dbConnected: boolean
  publishedNews: number
  draftNews: number
  candidacies: number
  members: number
  messages: number
  unreadMessages: number
}

// ---------------------------------------------------------------------------
// Armazenamento em memória (usado apenas quando não há DATABASE_URL)
// ---------------------------------------------------------------------------

const memory = {
  contactMessages: [] as AdminContactMessage[],
  members: [] as AdminMember[],
  candidacies: [] as SiteCandidacy[],
  newsPosts: [] as AdminNewsPost[],
  deletedNewsSlugs: [] as string[],
}

// Marcador (em PartyStat) que indica que o banco já foi inicializado
// (tabelas criadas e conteúdo institucional sincronizado).
const SEED_FLAG_KEY = 'news_seeded'

function newId(prefix: string): string {
  const stamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${stamp}${random}`
}

function isKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

function logDbUnavailable(context: string, error: unknown) {
  console.error(`Banco indisponível em "${context}" — usando modo resiliente:`, error)
}

function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 100)
  return base.length >= 2 ? base : `noticia-${Date.now().toString(36)}`
}

// ---------------------------------------------------------------------------
// Inicialização automática do banco conectado
// ---------------------------------------------------------------------------

// DDL idempotente espelhando o prisma/schema.prisma — permite que um banco
// recém-criado (ex.: Neon) seja usado imediatamente, sem rodar migrations.
const SQLITE_DDL = [
  'CREATE TABLE IF NOT EXISTS "NewsPost" ("id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "category" TEXT NOT NULL, "summary" TEXT NOT NULL, "content" TEXT NOT NULL, "author" TEXT NOT NULL, "featured" BOOLEAN NOT NULL DEFAULT false, "published" BOOLEAN NOT NULL DEFAULT true, "publishedAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE UNIQUE INDEX IF NOT EXISTS "NewsPost_slug_key" ON "NewsPost"("slug")',
  'CREATE TABLE IF NOT EXISTS "Member" ("id" TEXT NOT NULL PRIMARY KEY, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT, "city" TEXT NOT NULL, "region" TEXT NOT NULL, "birthYear" INTEGER, "motivation" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email")',
  'CREATE TABLE IF NOT EXISTS "ContactMessage" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "subject" TEXT NOT NULL, "message" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS "Candidacy" ("id" TEXT NOT NULL PRIMARY KEY, "position" TEXT NOT NULL, "election" TEXT NOT NULL, "candidate" TEXT NOT NULL, "slogan" TEXT, "proposal" TEXT, "status" TEXT NOT NULL DEFAULT \'Anunciada\', "order" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS "PartyStat" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "label" TEXT NOT NULL, "value" INTEGER NOT NULL, "suffix" TEXT, "order" INTEGER NOT NULL)',
  'CREATE UNIQUE INDEX IF NOT EXISTS "PartyStat_key_key" ON "PartyStat"("key")',
]

const POSTGRES_DDL = [
  'CREATE TABLE IF NOT EXISTS "NewsPost" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "category" TEXT NOT NULL, "summary" TEXT NOT NULL, "content" TEXT NOT NULL, "author" TEXT NOT NULL, "featured" BOOLEAN NOT NULL DEFAULT false, "published" BOOLEAN NOT NULL DEFAULT true, "publishedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id"))',
  'CREATE UNIQUE INDEX IF NOT EXISTS "NewsPost_slug_key" ON "NewsPost"("slug")',
  'CREATE TABLE IF NOT EXISTS "Member" ("id" TEXT NOT NULL, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT, "city" TEXT NOT NULL, "region" TEXT NOT NULL, "birthYear" INTEGER, "motivation" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Member_pkey" PRIMARY KEY ("id"))',
  'CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email")',
  'CREATE TABLE IF NOT EXISTS "ContactMessage" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "subject" TEXT NOT NULL, "message" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id"))',
  'CREATE TABLE IF NOT EXISTS "Candidacy" ("id" TEXT NOT NULL, "position" TEXT NOT NULL, "election" TEXT NOT NULL, "candidate" TEXT NOT NULL, "slogan" TEXT, "proposal" TEXT, "status" TEXT NOT NULL DEFAULT \'Anunciada\', "order" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Candidacy_pkey" PRIMARY KEY ("id"))',
  'CREATE TABLE IF NOT EXISTS "PartyStat" ("id" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL, "value" INTEGER NOT NULL, "suffix" TEXT, "order" INTEGER NOT NULL, CONSTRAINT "PartyStat_pkey" PRIMARY KEY ("id"))',
  'CREATE UNIQUE INDEX IF NOT EXISTS "PartyStat_key_key" ON "PartyStat"("key")',
]

// Inicialização completa (uma vez por instância): cria tabelas se faltarem e
// sincroniza o conteúdo institucional embutido. Retorna false quando o banco
// não pôde ser inicializado — a leitura cai para o modo resiliente.
let dbReadyCache: boolean | null = null

async function ensureDatabaseReady(
  db: NonNullable<ReturnType<typeof getDb>>
): Promise<boolean> {
  if (dbReadyCache === true) return true
  try {
    const url = (process.env.DATABASE_URL ?? '').toLowerCase()
    const statements = url.startsWith('file:') ? SQLITE_DDL : POSTGRES_DDL
    for (const statement of statements) {
      await db.$executeRawUnsafe(statement)
    }

    const flag = await db.partyStat.findUnique({ where: { key: SEED_FLAG_KEY } })
    if (!flag) {
      for (const post of FALLBACK_NEWS) {
        await db.newsPost.upsert({
          where: { slug: post.slug },
          create: {
            slug: post.slug,
            title: post.title,
            category: post.category,
            summary: post.summary,
            content: post.content,
            author: post.author,
            featured: post.featured,
            published: true,
            publishedAt: post.publishedAt,
          },
          update: {},
        })
      }
      for (const stat of FALLBACK_STATS) {
        await db.partyStat.upsert({
          where: { key: stat.key },
          create: {
            key: stat.key,
            label: stat.label,
            value: stat.value,
            suffix: stat.suffix,
            order: stat.order,
          },
          update: {},
        })
      }
      await db.partyStat.create({
        data: {
          key: SEED_FLAG_KEY,
          label: 'Marcador interno de sincronização das notícias',
          value: FALLBACK_NEWS.length,
          order: 9999,
        },
      })
    }
    dbReadyCache = true
    return true
  } catch (error) {
    logDbUnavailable('ensureDatabaseReady', error)
    return false
  }
}

// ---------------------------------------------------------------------------
// Leituras públicas
// ---------------------------------------------------------------------------

// Estatísticas institucionais da página inicial
export async function getStats() {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const stats = await db.partyStat.findMany({
          where: { key: { not: SEED_FLAG_KEY } },
          orderBy: { order: 'asc' },
        })
        return stats.length > 0 ? stats : FALLBACK_STATS
      }
    } catch (error) {
      logDbUnavailable('getStats', error)
    }
  }
  return FALLBACK_STATS
}

// Lista de notícias publicadas (com filtro por categoria, busca e exclusão de slug)
export async function listNews(filter: NewsFilter = {}): Promise<SiteNewsPost[]> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const where: Prisma.NewsPostWhereInput = { published: true }
        if (filter.category && filter.category !== 'Todas') {
          where.category = filter.category
        }
        if (filter.q) {
          where.OR = [
            { title: { contains: filter.q } },
            { summary: { contains: filter.q } },
          ]
        }
        if (filter.excludeSlug) {
          where.slug = { not: filter.excludeSlug }
        }
        return await db.newsPost.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          ...(filter.take ? { take: filter.take } : {}),
        })
      }
    } catch (error) {
      logDbUnavailable('listNews', error)
    }
  }
  return filterMemoryNews(filter)
}

// Filtra o conteúdo embutido + notícias em memória (modo sem banco)
function filterMemoryNews(filter: NewsFilter): SiteNewsPost[] {
  const memorySlugs = new Set(memory.newsPosts.map((post) => post.slug))
  let posts: SiteNewsPost[] = [
    ...memory.newsPosts.filter(
      (post) => post.published && post.slug !== filter.excludeSlug
    ),
    ...FALLBACK_NEWS.filter(
      (post) =>
        post.slug !== filter.excludeSlug &&
        !memorySlugs.has(post.slug) &&
        !memory.deletedNewsSlugs.includes(post.slug)
    ),
  ]
  if (filter.category && filter.category !== 'Todas') {
    posts = posts.filter((post) => post.category === filter.category)
  }
  if (filter.q) {
    const q = filter.q.toLowerCase()
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) || post.summary.toLowerCase().includes(q)
    )
  }
  posts = [...posts].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  )
  return filter.take ? posts.slice(0, filter.take) : posts
}

// Notícia completa por slug (sub-página /?noticia=slug) — apenas publicadas
export async function getNewsBySlug(slug: string): Promise<SiteNewsPost | null> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const post = await db.newsPost.findUnique({ where: { slug } })
        return post && post.published ? post : null
      }
    } catch (error) {
      logDbUnavailable('getNewsBySlug', error)
    }
  }
  const memoryPost = memory.newsPosts.find((post) => post.slug === slug)
  if (memoryPost) return memoryPost.published ? memoryPost : null
  const fallbackPost = FALLBACK_NEWS.find((post) => post.slug === slug)
  if (fallbackPost && !memory.deletedNewsSlugs.includes(slug)) return fallbackPost
  return null
}

// Lista pública de candidaturas
export async function listCandidacies(): Promise<SiteCandidacy[]> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.candidacy.findMany({
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        })
      }
    } catch (error) {
      logDbUnavailable('listCandidacies', error)
    }
  }
  return [...memory.candidacies].sort(
    (a, b) =>
      a.order - b.order || b.createdAt.getTime() - a.createdAt.getTime()
  )
}

// ---------------------------------------------------------------------------
// Escritas públicas (formulários)
// ---------------------------------------------------------------------------

// Mensagem de contato
export async function createContactMessage(data: NewContactMessage): Promise<void> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        await db.contactMessage.create({ data })
        return
      }
    } catch (error) {
      logDbUnavailable('createContactMessage', error)
    }
  }
  memory.contactMessages.push({ ...data, id: newId('contato'), createdAt: new Date(), read: false })
}

// Filiação de novo membro
export async function createMember(
  data: NewMember
): Promise<{ ok: true; id: string } | { ok: false; duplicate: true }> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const member = await db.member.create({ data })
        return { ok: true, id: member.id }
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2002') {
        return { ok: false, duplicate: true }
      }
      logDbUnavailable('createMember', error)
    }
  }
  if (memory.members.some((member) => member.email === data.email)) {
    return { ok: false, duplicate: true }
  }
  const id = newId('filiado')
  memory.members.push({ ...data, id, createdAt: new Date() })
  return { ok: true, id }
}

// ---------------------------------------------------------------------------
// Notícias — gestão pela área do administrador
// ---------------------------------------------------------------------------

// Lista completa (publicadas e rascunhos) para a área do administrador
export async function listAdminNews(): Promise<AdminNewsPost[]> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.newsPost.findMany({ orderBy: { publishedAt: 'desc' } })
      }
    } catch (error) {
      logDbUnavailable('listAdminNews', error)
    }
  }
  const memorySlugs = new Set(memory.newsPosts.map((post) => post.slug))
  const embedded: AdminNewsPost[] = FALLBACK_NEWS.filter(
    (post) =>
      !memorySlugs.has(post.slug) && !memory.deletedNewsSlugs.includes(post.slug)
  ).map((post) => ({ ...post, id: `emb-${post.slug}`, published: true }))
  return [...memory.newsPosts, ...embedded].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  )
}

// Registrar notícia (admin)
export async function createNews(
  data: NewNewsPost & { slug?: string; publishedAt?: Date }
): Promise<{ ok: true; post: AdminNewsPost } | { ok: false; duplicate: true }> {
  const slug = data.slug && data.slug.length >= 2 ? data.slug : slugify(data.title)
  const publishedAt = data.publishedAt ?? new Date()

  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const post = await db.newsPost.create({
          data: {
            slug,
            title: data.title,
            category: data.category,
            summary: data.summary,
            content: data.content,
            author: data.author,
            featured: data.featured,
            published: data.published,
            publishedAt,
          },
        })
        return { ok: true, post }
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2002') {
        return { ok: false, duplicate: true }
      }
      logDbUnavailable('createNews', error)
    }
  }
  if (
    memory.newsPosts.some((post) => post.slug === slug) ||
    (!memory.deletedNewsSlugs.includes(slug) &&
      FALLBACK_NEWS.some((post) => post.slug === slug))
  ) {
    return { ok: false, duplicate: true }
  }
  const post: AdminNewsPost = {
    id: newId('noticia'),
    slug,
    title: data.title,
    category: data.category,
    summary: data.summary,
    content: data.content,
    author: data.author,
    featured: data.featured,
    published: data.published,
    publishedAt,
  }
  memory.newsPosts.push(post)
  return { ok: true, post }
}

// Editar notícia (admin) — null quando não encontrada
export async function updateNews(
  id: string,
  data: NewsUpdate
): Promise<AdminNewsPost | null> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        if (id.startsWith('emb-')) {
          const slug = id.slice('emb-'.length)
          const existing = await db.newsPost.findUnique({ where: { slug } })
          if (existing) {
            return await db.newsPost.update({ where: { id: existing.id }, data })
          }
          const base = FALLBACK_NEWS.find((post) => post.slug === slug)
          if (!base) return null
          return await db.newsPost.create({
            data: {
              slug: base.slug,
              title: base.title,
              category: base.category,
              summary: base.summary,
              content: base.content,
              author: base.author,
              featured: base.featured,
              published: true,
              publishedAt: base.publishedAt,
              ...data,
            },
          })
        }
        return await db.newsPost.update({ where: { id }, data })
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return null
      }
      logDbUnavailable('updateNews', error)
    }
  }
  if (id.startsWith('emb-')) {
    const slug = id.slice('emb-'.length)
    const existing = memory.newsPosts.find((post) => post.slug === slug)
    if (existing) {
      Object.assign(existing, data)
      return existing
    }
    const base = FALLBACK_NEWS.find((post) => post.slug === slug)
    if (!base || memory.deletedNewsSlugs.includes(slug)) return null
    const copy: AdminNewsPost = { ...base, id: newId('noticia'), ...data }
    memory.newsPosts.push(copy)
    return copy
  }
  const post = memory.newsPosts.find((post) => post.id === id)
  if (!post) return null
  Object.assign(post, data)
  return post
}

// Excluir notícia (admin) — false quando não encontrada
export async function deleteNews(id: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        if (id.startsWith('emb-')) {
          const slug = id.slice('emb-'.length)
          const existing = await db.newsPost.findUnique({ where: { slug } })
          if (!existing) return false
          await db.newsPost.delete({ where: { id: existing.id } })
          return true
        }
        await db.newsPost.delete({ where: { id } })
        return true
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return false
      }
      logDbUnavailable('deleteNews', error)
      return false
    }
  }
  if (id.startsWith('emb-')) {
    const slug = id.slice('emb-'.length)
    memory.deletedNewsSlugs.push(slug)
    memory.newsPosts = memory.newsPosts.filter((post) => post.slug !== slug)
    return true
  }
  const index = memory.newsPosts.findIndex((post) => post.id === id)
  if (index === -1) return false
  memory.newsPosts.splice(index, 1)
  return true
}

// ---------------------------------------------------------------------------
// Candidaturas — gestão pela área do administrador
// ---------------------------------------------------------------------------

// Registrar candidatura (admin)
export async function createCandidacy(data: NewCandidacy): Promise<SiteCandidacy> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const last = await db.candidacy.findFirst({ orderBy: { order: 'desc' } })
        return await db.candidacy.create({
          data: { ...data, order: (last?.order ?? 0) + 1 },
        })
      }
    } catch (error) {
      logDbUnavailable('createCandidacy', error)
    }
  }
  const order =
    memory.candidacies.reduce((max, candidacy) => Math.max(max, candidacy.order), 0) + 1
  const candidacy: SiteCandidacy = {
    ...data,
    id: newId('candidatura'),
    order,
    createdAt: new Date(),
  }
  memory.candidacies.push(candidacy)
  return candidacy
}

// Editar candidatura (admin) — null quando não encontrada
export async function updateCandidacy(
  id: string,
  data: Omit<NewCandidacy, never>
): Promise<SiteCandidacy | null> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.candidacy.update({ where: { id }, data })
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return null
      }
      logDbUnavailable('updateCandidacy', error)
    }
  }
  const existing = memory.candidacies.find((candidacy) => candidacy.id === id)
  if (!existing) return null
  Object.assign(existing, data)
  return existing
}

// Excluir candidatura (admin) — false quando não encontrada
export async function deleteCandidacy(id: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        await db.candidacy.delete({ where: { id } })
        return true
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return false
      }
      logDbUnavailable('deleteCandidacy', error)
      return false
    }
  }
  const index = memory.candidacies.findIndex((candidacy) => candidacy.id === id)
  if (index === -1) return false
  memory.candidacies.splice(index, 1)
  return true
}

// ---------------------------------------------------------------------------
// Filiados e mensagens — listas para a área do administrador
// ---------------------------------------------------------------------------

export async function listMembers(): Promise<AdminMember[]> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.member.findMany({ orderBy: { createdAt: 'desc' } })
      }
    } catch (error) {
      logDbUnavailable('listMembers', error)
    }
  }
  return [...memory.members].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

export async function listContactMessages(): Promise<AdminContactMessage[]> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
      }
    } catch (error) {
      logDbUnavailable('listContactMessages', error)
    }
  }
  return [...memory.contactMessages].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

// Marcar mensagem como lida/não lida — null quando não encontrada
export async function setContactMessageRead(
  id: string,
  read: boolean
): Promise<AdminContactMessage | null> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        return await db.contactMessage.update({ where: { id }, data: { read } })
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return null
      }
      logDbUnavailable('setContactMessageRead', error)
    }
  }
  const existing = memory.contactMessages.find((message) => message.id === id)
  if (!existing) return null
  existing.read = read
  return existing
}

// Excluir mensagem — false quando não encontrada
export async function deleteContactMessage(id: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        await db.contactMessage.delete({ where: { id } })
        return true
      }
    } catch (error) {
      if (isKnownRequestError(error) && error.code === 'P2025') {
        return false
      }
      logDbUnavailable('deleteContactMessage', error)
      return false
    }
  }
  const index = memory.contactMessages.findIndex((message) => message.id === id)
  if (index === -1) return false
  memory.contactMessages.splice(index, 1)
  return true
}

// ---------------------------------------------------------------------------
// Painel — visão geral para a área do administrador
// ---------------------------------------------------------------------------

export async function getOverview(): Promise<Overview> {
  const db = getDb()
  if (db) {
    try {
      const ready = await ensureDatabaseReady(db)
      if (ready) {
        const [publishedNews, draftNews, candidacies, members, messages, unreadMessages] =
          await Promise.all([
            db.newsPost.count({ where: { published: true } }),
            db.newsPost.count({ where: { published: false } }),
            db.candidacy.count(),
            db.member.count(),
            db.contactMessage.count(),
            db.contactMessage.count({ where: { read: false } }),
          ])
        return {
          dbConnected: true,
          publishedNews,
          draftNews,
          candidacies,
          members,
          messages,
          unreadMessages,
        }
      }
    } catch (error) {
      logDbUnavailable('getOverview', error)
    }
  }
  const adminNews = await listAdminNews()
  return {
    dbConnected: false,
    publishedNews: adminNews.filter((post) => post.published).length,
    draftNews: adminNews.filter((post) => !post.published).length,
    candidacies: memory.candidacies.length,
    members: memory.members.length,
    messages: memory.contactMessages.length,
    unreadMessages: memory.contactMessages.filter((message) => !message.read).length,
  }
}
