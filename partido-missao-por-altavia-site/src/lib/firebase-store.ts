// Camada de persistência online — Firebase Realtime Database (PMA).
//
// Ativada quando não há DATABASE_URL: grava notícias, candidaturas,
// filiados, mensagens e estatísticas no Realtime Database do projeto
// "texnk-87824". O conteúdo institucional embutido (site-data.ts) é
// sincronizado uma única vez na primeira leitura (marcador pma/meta/seeded).
//
// Tudo aqui roda no servidor, dentro das rotas de API: a URL do banco não
// aparece no código enviado ao navegador. Se o Realtime Database ficar
// inacessível, as funções lançam RtdbUnavailableError e a camada de dados
// (src/lib/data.ts) cai para o modo memória — o site nunca quebra.
//
// Layout no banco (nó "pma"):
//   pma/newsPosts/<id>        — notícias (id, slug, título, corpo, published…)
//   pma/deletedNewsSlugs/<slug> — lápides de notícias embutidas removidas
//   pma/candidacies/<id>      — candidaturas
//   pma/members/<id>          — filiados
//   pma/messages/<id>         — mensagens de contato
//   pma/stats/<key>           — estatísticas institucionais
//   pma/meta/seeded           — marcador da sincronização inicial

import {
  FALLBACK_NEWS,
  FALLBACK_STATS,
  type SiteCandidacy,
  type SiteNewsPost,
  type SiteStat,
} from '@/lib/site-data'
import {
  rtdbCoolingDown,
  rtdbDelete,
  rtdbGet,
  rtdbPatch,
  rtdbPut,
} from '@/lib/firebase-rtdb'
import type {
  AdminContactMessage,
  AdminMember,
  AdminNewsPost,
  NewCandidacy,
  NewContactMessage,
  NewMember,
  NewNewsPost,
  NewsFilter,
  NewsUpdate,
  Overview,
} from '@/lib/data'

// ---------------------------------------------------------------------------
// Caminhos no Realtime Database
// ---------------------------------------------------------------------------

const ROOT = 'pma'
const PATH_NEWS = `${ROOT}/newsPosts`
const PATH_DELETED_NEWS = `${ROOT}/deletedNewsSlugs`
const PATH_CANDIDACIES = `${ROOT}/candidacies`
const PATH_MEMBERS = `${ROOT}/members`
const PATH_MESSAGES = `${ROOT}/messages`
const PATH_STATS = `${ROOT}/stats`
const PATH_SEEDED = `${ROOT}/meta/seeded`

// ---------------------------------------------------------------------------
// Utilidades locais (mesma lógica da camada de memória em data.ts)
// ---------------------------------------------------------------------------

function newId(prefix: string): string {
  const stamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${stamp}${random}`
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

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  const date = new Date(
    typeof value === 'number' || typeof value === 'string' ? value : Date.now()
  )
  return Number.isNaN(date.getTime()) ? new Date() : date
}

// ---------------------------------------------------------------------------
// Preparação (uma vez por instância): sincroniza o conteúdo institucional
// ---------------------------------------------------------------------------

let readyCache: boolean | null = null

// O Realtime Database está utilizável? (true = leituras/escritas persistentes)
export async function firebaseIsReady(): Promise<boolean> {
  if (readyCache === true && !rtdbCoolingDown()) return true
  if (rtdbCoolingDown()) {
    readyCache = null
    return false
  }
  try {
    const seeded = await rtdbGet<boolean>(PATH_SEEDED)
    if (seeded === null) {
      // Primeira execução: grava as notícias e estatísticas institucionais.
      // Os PUTs são idempotentes — se algo falhar no meio, a próxima execução
      // refaz tudo até o marcador ser gravado por último.
      for (const post of FALLBACK_NEWS) {
        await rtdbPut(`${PATH_NEWS}/${post.id}`, {
          id: post.id,
          slug: post.slug,
          title: post.title,
          category: post.category,
          summary: post.summary,
          content: post.content,
          author: post.author,
          featured: post.featured,
          published: true,
          publishedAt: post.publishedAt.toISOString(),
        })
      }
      for (const stat of FALLBACK_STATS) {
        await rtdbPut(`${PATH_STATS}/${stat.key}`, { ...stat })
      }
      await rtdbPut(PATH_SEEDED, true)
    }
    readyCache = true
    return true
  } catch {
    readyCache = null
    return false
  }
}

// ---------------------------------------------------------------------------
// Notícias
// ---------------------------------------------------------------------------

type StoredNews = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  published: boolean
  publishedAt: string
}

async function readNewsMap(): Promise<Map<string, StoredNews>> {
  const map = await rtdbGet<Record<string, StoredNews>>(PATH_NEWS)
  return new Map(Object.entries(map ?? {}))
}

async function readDeletedSlugs(): Promise<Set<string>> {
  const map = await rtdbGet<Record<string, boolean>>(PATH_DELETED_NEWS)
  return new Set(Object.keys(map ?? {}))
}

function toAdminPost(stored: StoredNews): AdminNewsPost {
  return {
    id: stored.id,
    slug: stored.slug,
    title: stored.title,
    category: stored.category,
    summary: stored.summary,
    content: stored.content,
    author: stored.author,
    featured: stored.featured,
    published: stored.published,
    publishedAt: toDate(stored.publishedAt),
  }
}

function applyNewsFilter(posts: SiteNewsPost[], filter: NewsFilter): SiteNewsPost[] {
  let list = posts
  if (filter.category && filter.category !== 'Todas') {
    list = list.filter((post) => post.category === filter.category)
  }
  if (filter.q) {
    const q = filter.q.toLowerCase()
    list = list.filter(
      (post) =>
        post.title.toLowerCase().includes(q) || post.summary.toLowerCase().includes(q)
    )
  }
  list = [...list].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  return filter.take ? list.slice(0, filter.take) : list
}

// Lista de notícias publicadas (com filtro por categoria, busca e exclusão)
export async function fbListNews(filter: NewsFilter): Promise<SiteNewsPost[]> {
  const [stored, deletedSlugs] = await Promise.all([readNewsMap(), readDeletedSlugs()])
  const storedSlugs = new Set<string>()
  const posts: SiteNewsPost[] = []
  for (const post of stored.values()) {
    storedSlugs.add(post.slug)
    if (post.published && post.slug !== filter.excludeSlug) {
      posts.push(toAdminPost(post))
    }
  }
  for (const post of FALLBACK_NEWS) {
    if (
      post.slug !== filter.excludeSlug &&
      !storedSlugs.has(post.slug) &&
      !deletedSlugs.has(post.slug)
    ) {
      posts.push(post)
    }
  }
  return applyNewsFilter(posts, filter)
}

// Notícia completa por slug — apenas publicadas
export async function fbGetNewsBySlug(slug: string): Promise<SiteNewsPost | null> {
  const [stored, deletedSlugs] = await Promise.all([readNewsMap(), readDeletedSlugs()])
  const found = [...stored.values()].find((post) => post.slug === slug)
  if (found) return found.published ? toAdminPost(found) : null
  const fallback = FALLBACK_NEWS.find((post) => post.slug === slug)
  if (fallback && !deletedSlugs.has(slug)) return fallback
  return null
}

// Lista completa (publicadas e rascunhos) para a área do administrador
export async function fbListAdminNews(): Promise<AdminNewsPost[]> {
  const [stored, deletedSlugs] = await Promise.all([readNewsMap(), readDeletedSlugs()])
  const posts: AdminNewsPost[] = [...stored.values()].map(toAdminPost)
  const storedSlugs = new Set(posts.map((post) => post.slug))
  for (const post of FALLBACK_NEWS) {
    if (!storedSlugs.has(post.slug) && !deletedSlugs.has(post.slug)) {
      posts.push({ ...post, id: `emb-${post.slug}`, published: true })
    }
  }
  return posts.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  )
}

// Registrar notícia (admin)
export async function fbCreateNews(
  data: NewNewsPost & { slug?: string; publishedAt?: Date }
): Promise<{ ok: true; post: AdminNewsPost } | { ok: false; duplicate: true }> {
  const slug = data.slug && data.slug.length >= 2 ? data.slug : slugify(data.title)
  const publishedAt = data.publishedAt ?? new Date()

  const [stored, deletedSlugs] = await Promise.all([readNewsMap(), readDeletedSlugs()])
  const storedSlugs = new Set([...stored.values()].map((post) => post.slug))
  if (
    storedSlugs.has(slug) ||
    (!deletedSlugs.has(slug) && FALLBACK_NEWS.some((post) => post.slug === slug))
  ) {
    return { ok: false, duplicate: true }
  }
  const post: StoredNews = {
    id: newId('noticia'),
    slug,
    title: data.title,
    category: data.category,
    summary: data.summary,
    content: data.content,
    author: data.author,
    featured: data.featured,
    published: data.published,
    publishedAt: publishedAt.toISOString(),
  }
  await rtdbPut(`${PATH_NEWS}/${post.id}`, post)
  return { ok: true, post: toAdminPost(post) }
}

// Editar notícia (admin) — null quando não encontrada
export async function fbUpdateNews(
  id: string,
  data: NewsUpdate
): Promise<AdminNewsPost | null> {
  const stored = await readNewsMap()
  // IDs de posts embutidos (emb-<slug>) resolvem para o registro real.
  const key = id.startsWith('emb-') ? id.slice('emb-'.length) : id

  const target = [...stored.values()].find((post) => post.id === key)
  let nodeId: string
  if (target) {
    nodeId = target.id
    await rtdbPatch(`${PATH_NEWS}/${nodeId}`, data)
  } else if (id.startsWith('emb-')) {
    // Post embutido ainda não gravado no banco — cria a partir do original.
    const base = FALLBACK_NEWS.find((post) => post.slug === key)
    if (!base) return null
    const post: StoredNews = {
      id: newId('noticia'),
      slug: base.slug,
      title: base.title,
      category: base.category,
      summary: base.summary,
      content: base.content,
      author: base.author,
      featured: base.featured,
      published: true,
      publishedAt: base.publishedAt.toISOString(),
    }
    nodeId = post.id
    await rtdbPut(`${PATH_NEWS}/${nodeId}`, { ...post, ...data })
  } else {
    return null
  }

  const updated = await rtdbGet<StoredNews>(`${PATH_NEWS}/${nodeId}`)
  return updated ? toAdminPost(updated) : null
}

// Excluir notícia (admin) — false quando não encontrada
export async function fbDeleteNews(id: string): Promise<boolean> {
  const stored = await readNewsMap()
  const key = id.startsWith('emb-') ? id.slice('emb-'.length) : id
  const target = [...stored.values()].find((post) => post.id === key)

  if (!target) {
    // Post embutido nunca gravado: registra a lápide para não reaparecer.
    if (id.startsWith('emb-') && FALLBACK_NEWS.some((post) => post.slug === key)) {
      await rtdbPut(`${PATH_DELETED_NEWS}/${key}`, true)
      return true
    }
    return false
  }
  await rtdbDelete(`${PATH_NEWS}/${target.id}`)
  await rtdbPut(`${PATH_DELETED_NEWS}/${target.slug}`, true)
  return true
}

// ---------------------------------------------------------------------------
// Candidaturas
// ---------------------------------------------------------------------------

type StoredCandidacy = Omit<SiteCandidacy, 'createdAt'> & { createdAt: string }

async function readCandidacies(): Promise<SiteCandidacy[]> {
  const map = await rtdbGet<Record<string, StoredCandidacy>>(PATH_CANDIDACIES)
  return Object.values(map ?? {}).map((candidacy) => ({
    ...candidacy,
    createdAt: toDate(candidacy.createdAt),
  }))
}

// Lista pública de candidaturas
export async function fbListCandidacies(): Promise<SiteCandidacy[]> {
  const candidacies = await readCandidacies()
  return candidacies.sort(
    (a, b) =>
      a.order - b.order || b.createdAt.getTime() - a.createdAt.getTime()
  )
}

// Registrar candidatura (admin)
export async function fbCreateCandidacy(data: NewCandidacy): Promise<SiteCandidacy> {
  const candidacies = await readCandidacies()
  const order = candidacies.reduce((max, candidacy) => Math.max(max, candidacy.order), 0) + 1
  const candidacy: SiteCandidacy = {
    ...data,
    id: newId('candidatura'),
    order,
    createdAt: new Date(),
  }
  await rtdbPut(`${PATH_CANDIDACIES}/${candidacy.id}`, {
    ...candidacy,
    createdAt: candidacy.createdAt.toISOString(),
  })
  return candidacy
}

// Editar candidatura (admin) — null quando não encontrada
export async function fbUpdateCandidacy(
  id: string,
  data: NewCandidacy
): Promise<SiteCandidacy | null> {
  const existing = await rtdbGet<StoredCandidacy>(`${PATH_CANDIDACIES}/${id}`)
  if (!existing) return null
  await rtdbPatch(`${PATH_CANDIDACIES}/${id}`, data)
  const updated = await rtdbGet<StoredCandidacy>(`${PATH_CANDIDACIES}/${id}`)
  return updated ? { ...updated, createdAt: toDate(updated.createdAt) } : null
}

// Excluir candidatura (admin) — false quando não encontrada
export async function fbDeleteCandidacy(id: string): Promise<boolean> {
  const existing = await rtdbGet<StoredCandidacy>(`${PATH_CANDIDACIES}/${id}`)
  if (!existing) return false
  await rtdbDelete(`${PATH_CANDIDACIES}/${id}`)
  return true
}

// ---------------------------------------------------------------------------
// Filiados e mensagens
// ---------------------------------------------------------------------------

type StoredMember = Omit<AdminMember, 'createdAt'> & { createdAt: string }
type StoredMessage = Omit<AdminContactMessage, 'createdAt'> & { createdAt: string }

// Filiação de novo membro
export async function fbCreateMember(
  data: NewMember
): Promise<{ ok: true; id: string } | { ok: false; duplicate: true }> {
  const map = await rtdbGet<Record<string, StoredMember>>(PATH_MEMBERS)
  const members = Object.values(map ?? {})
  if (members.some((member) => member.email === data.email)) {
    return { ok: false, duplicate: true }
  }
  const id = newId('filiado')
  await rtdbPut(`${PATH_MEMBERS}/${id}`, {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  })
  return { ok: true, id }
}

export async function fbListMembers(): Promise<AdminMember[]> {
  const map = await rtdbGet<Record<string, StoredMember>>(PATH_MEMBERS)
  return Object.values(map ?? {})
    .map((member) => ({ ...member, createdAt: toDate(member.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Mensagem de contato
export async function fbCreateContactMessage(data: NewContactMessage): Promise<void> {
  const id = newId('contato')
  await rtdbPut(`${PATH_MESSAGES}/${id}`, {
    ...data,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  })
}

export async function fbListContactMessages(): Promise<AdminContactMessage[]> {
  const map = await rtdbGet<Record<string, StoredMessage>>(PATH_MESSAGES)
  return Object.values(map ?? {})
    .map((message) => ({ ...message, createdAt: toDate(message.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Marcar mensagem como lida/não lida — null quando não encontrada
export async function fbSetContactMessageRead(
  id: string,
  read: boolean
): Promise<AdminContactMessage | null> {
  const existing = await rtdbGet<StoredMessage>(`${PATH_MESSAGES}/${id}`)
  if (!existing) return null
  await rtdbPatch(`${PATH_MESSAGES}/${id}`, { read })
  return { ...existing, read, createdAt: toDate(existing.createdAt) }
}

// Excluir mensagem — false quando não encontrada
export async function fbDeleteContactMessage(id: string): Promise<boolean> {
  const existing = await rtdbGet<StoredMessage>(`${PATH_MESSAGES}/${id}`)
  if (!existing) return false
  await rtdbDelete(`${PATH_MESSAGES}/${id}`)
  return true
}

// ---------------------------------------------------------------------------
// Estatísticas e painel
// ---------------------------------------------------------------------------

// Estatísticas institucionais da página inicial
export async function fbGetStats(): Promise<SiteStat[]> {
  const map = await rtdbGet<Record<string, SiteStat>>(PATH_STATS)
  const stats = Object.entries(map ?? {})
    .map(([key, value]) => ({ ...value, id: value.id ?? key }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return stats.length > 0 ? stats : FALLBACK_STATS
}

// Visão geral para a área do administrador
export async function fbGetOverview(): Promise<Overview> {
  const [news, candidacies, members, messages] = await Promise.all([
    fbListAdminNews(),
    fbListCandidacies(),
    fbListMembers(),
    fbListContactMessages(),
  ])
  return {
    dbConnected: true,
    publishedNews: news.filter((post) => post.published).length,
    draftNews: news.filter((post) => !post.published).length,
    candidacies: candidacies.length,
    members: members.length,
    messages: messages.length,
    unreadMessages: messages.filter((message) => !message.read).length,
  }
}
