import { NextResponse } from 'next/server'
import { getStats } from '@/lib/data'

// GET /api/stats — estatísticas institucionais
export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as estatísticas.' },
      { status: 500 }
    )
  }
}
