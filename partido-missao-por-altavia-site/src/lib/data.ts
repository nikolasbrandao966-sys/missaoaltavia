// Camada de dados — Partido Missão por Altávia (PMA)
//
// Estratégia de resiliência:
// - Com DATABASE_URL configurada (ex.: desenvolvimento local com SQLite,
//   ou um banco gerenciado como Turso/Supabase/Neon no futuro): todas as
//   leituras e escritas usam o Prisma.
// - Sem DATABASE_URL (ex.: deploy na Vercel sem variáveis de ambiente):
//   as leituras usam o conteúdo institucional embutido (site-data.ts) e as
//   escritas (contato, filiação, candidaturas do admin) ficam em memória da
//   função serverless — o site nunca quebra com erro de banco.
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

// ---------------------------------------------------------------------------
// Armazenamento em memória (usado apenas quando não há DATABASE_URL)
// ---------------------------------------------------------------------------

type MemoryContactMessage = NewContactMessage & { id: string; createdAt: Date }
type MemoryMember = NewMember & { id: string; createdAt: Date }

const memory = {
  contactMessages: [] as MemoryContactMessage[],
  members: [] as MemoryMember[],
  candidacies: [] as SiteCandidacy[],
}

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

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

// Estatísticas institucionais da página inicial
export async function getStats() {
  const db = getDb()
  if (db) {
    try {
      return await db.partyStat.findMany({ orderBy: { order: 'asc' } })
    } catch (error) {
      logDbUnavailable('getStats', error)
    }
  }
  return FALLBACK_STATS
}

// Lista de notícias (com filtro por categoria, busca textual e exclusão de slug)
export async function listNews(filter: NewsFilter = {}): Promise<SiteNewsPost[]> {
  const db = getDb()
  if (db) {
    try {
      const where: {
        category?: string
        OR?: { title: { contains: string } } | { summary: { contains: string } }[]
        slug?: { not: string }
      } = {}
      if (filter.category && filter.category !== 'Todas') {
        where.category = filter.category
      }
      if (filter.q) {
        where.OR = [{ title: { contains: filter.q } }, { summary: { contains: filter.q } }]
      }
      if (filter.excludeSlug) {
        where.slug = { not: filter.excludeSlug }
      }

      return await db.newsPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        ...(filter.take ? { take: filter.take } : {}),
      })
    } catch (error) {
      logDbUnavailable('listNews', error)
    }
  }

  // Fallback: filtra o conteúdo embutido
  let posts = FALLBACK_NEWS.filter((post) => post.slug !== filter.excludeSlug)
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

// Notícia completa por slug (sub-página /?noticia=slug)
export async function getNewsBySlug(slug: string): Promise<SiteNewsPost | null> {
  const db = getDb()
  if (db) {
    try {
      return await db.newsPost.findUnique({ where: { slug } })
    } catch (error) {
      logDbUnavailable('getNewsBySlug', error)
    }
  }
  return FALLBACK_NEWS.find((post) => post.slug === slug) ?? null
}

// Lista pública de candidaturas
export async function listCandidacies(): Promise<SiteCandidacy[]> {
  const db = getDb()
  if (db) {
    try {
      return await db.candidacy.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      })
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
// Escritas
// ---------------------------------------------------------------------------

// Mensagem de contato
export async function createContactMessage(data: NewContactMessage): Promise<void> {
  const db = getDb()
  if (db) {
    try {
      await db.contactMessage.create({ data })
      return
    } catch (error) {
      logDbUnavailable('createContactMessage', error)
    }
  }
  memory.contactMessages.push({ ...data, id: newId('contato'), createdAt: new Date() })
}

// Filiação de novo membro
export async function createMember(
  data: NewMember
): Promise<{ ok: true; id: string } | { ok: false; duplicate: true }> {
  const db = getDb()
  if (db) {
    try {
      const member = await db.member.create({ data })
      return { ok: true, id: member.id }
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

// Registrar candidatura (admin)
export async function createCandidacy(data: NewCandidacy): Promise<SiteCandidacy> {
  const db = getDb()
  if (db) {
    try {
      const last = await db.candidacy.findFirst({ orderBy: { order: 'desc' } })
      return await db.candidacy.create({
        data: { ...data, order: (last?.order ?? 0) + 1 },
      })
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
      return await db.candidacy.update({ where: { id }, data })
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
      await db.candidacy.delete({ where: { id } })
      return true
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
