import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin-auth'
import { deleteNews, updateNews } from '@/lib/data'

const newsSchema = z.object({
  title: z.string().trim().min(5, 'O título deve ter ao menos 5 caracteres.').max(180),
  category: z.string().trim().min(2, 'Informe a categoria.').max(60),
  summary: z.string().trim().min(10, 'O resumo deve ter ao menos 10 caracteres.').max(400),
  content: z.string().trim().min(30, 'O conteúdo deve ter ao menos 30 caracteres.').max(20000),
  author: z.string().trim().min(2, 'Informe o autor.').max(120),
  featured: z.boolean(),
  published: z.boolean(),
})

const newsPatchSchema = z.object({
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
})

// PUT /api/admin/news/[id] — editar notícia (admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = newsSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const post = await updateNews(id, parsed.data)
    if (!post) {
      return NextResponse.json({ error: 'Notícia não encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, post })
  } catch (error) {
    console.error('Erro ao editar notícia:', error)
    return NextResponse.json({ error: 'Não foi possível editar a notícia.' }, { status: 500 })
  }
}

// PATCH /api/admin/news/[id] — publicar/despublicar e destaque (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = newsPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const post = await updateNews(id, parsed.data)
    if (!post) {
      return NextResponse.json({ error: 'Notícia não encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, post })
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar a notícia.' }, { status: 500 })
  }
}

// DELETE /api/admin/news/[id] — excluir notícia (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const { id } = await params
    const deleted = await deleteNews(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Notícia não encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir notícia:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a notícia.' }, { status: 500 })
  }
}
