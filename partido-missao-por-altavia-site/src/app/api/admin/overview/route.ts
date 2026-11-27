import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { getOverview } from '@/lib/data'

// GET /api/admin/overview — painel do administrador
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const overview = await getOverview()
    return NextResponse.json({ overview })
  } catch (error) {
    console.error('Erro ao montar o painel do administrador:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar o painel agora.' },
      { status: 500 }
    )
  }
}
