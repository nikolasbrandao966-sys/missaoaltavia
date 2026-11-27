import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin-auth'
import { createNews, listAdminNews } from '@/lib/data'

const newsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'O título deve ter ao menos 5 caracteres.')
    .max(180, 'O título deve ter até 180 caracteres.'),
  category: z
    .string()
    .trim()
    .min(2, 'Informe a categoria (ex.: Institucional).')
    .max(60, 'A categoria deve ter até 60 caracteres.'),
  summary: z
    .string()
    .trim()
    .min(10, 'O resumo deve ter ao menos 10 caracteres.')
    .max(400, 'O resumo deve ter até 400 caracteres.'),
  content: z
    .string()
    .trim()
    .min(30, 'O conteúdo deve ter ao menos 30 caracteres.')
    .max(20000, 'O conteúdo deve ter até 20.000 caracteres.'),
  author: z
    .string()
    .trim()
    .min(2, 'Informe o autor.')
    .max(120, 'O autor deve ter até 120 caracteres.'),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  publishedAt: z.coerce.date().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,120}$/, 'Slug inválido — use letras minúsculas, números e traços.')
    .optional()
    .or(z.literal('')),
})

// GET /api/admin/news — todas as notícias (publicadas e rascunhos)
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const posts = await listAdminNews()
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Erro ao listar notícias para o administrador:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as notícias agora.' },
      { status: 500 }
    )
  }
}

// POST /api/admin/news — registrar nova notícia
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const parsed = newsSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const result = await createNews({
      title: data.title,
      category: data.category,
      summary: data.summary,
      content: data.content,
      author: data.author,
      featured: data.featured,
      published: data.published,
      ...(data.publishedAt ? { publishedAt: data.publishedAt } : {}),
      ...(data.slug ? { slug: data.slug } : {}),
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Já existe uma notícia com este título. Ajuste o título e tente de novo.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ ok: true, post: result.post }, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar notícia:', error)
    return NextResponse.json(
      { error: 'Não foi possível registrar a notícia. Tente novamente.' },
      { status: 500 }
    )
  }
}
