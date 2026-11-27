import { NextRequest, NextResponse } from 'next/server'
import { listNews } from '@/lib/data'

// GET /api/news?category=Programa&q=escolas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const q = searchParams.get('q')?.trim() || undefined

    const posts = await listNews({ category, q })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Erro ao buscar notícias:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as notícias no momento.' },
      { status: 500 }
    )
  }
}
