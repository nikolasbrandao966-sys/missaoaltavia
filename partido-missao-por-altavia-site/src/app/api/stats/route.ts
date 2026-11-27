import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats — estatísticas institucionais
export async function GET() {
  try {
    const stats = await db.partyStat.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as estatísticas.' },
      { status: 500 }
    )
  }
}
