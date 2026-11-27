import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { listContactMessages } from '@/lib/data'

// GET /api/admin/messages — mensagens de contato recebidas
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const messages = await listContactMessages()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erro ao listar mensagens de contato:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as mensagens agora.' },
      { status: 500 }
    )
  }
}
