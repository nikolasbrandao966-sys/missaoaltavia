import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/news?category=Programa&q=escolas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')?.trim()

    const where: {
      category?: string
      OR?: { title: { contains: string } } | { summary: { contains: string } }[]
    } = {}
    if (category && category !== 'Todas') {
      where.category = category
    }
    if (q) {
      where.OR = [{ title: { contains: q } }, { summary: { contains: q } }]
    }

    const posts = await db.newsPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        summary: true,
        content: true,
        author: true,
        featured: true,
        publishedAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Erro ao buscar notícias:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as notícias no momento.' },
      { status: 500 }
    )
  }
}
