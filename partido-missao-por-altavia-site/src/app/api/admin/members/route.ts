import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { listMembers } from '@/lib/data'

// GET /api/admin/members — lista de filiados
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const members = await listMembers()
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Erro ao listar filiados:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar os filiados agora.' },
      { status: 500 }
    )
  }
}
