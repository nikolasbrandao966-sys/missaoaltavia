import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin-auth'
import { deleteContactMessage, setContactMessageRead } from '@/lib/data'

const messagePatchSchema = z.object({
  read: z.boolean(),
})

// PATCH /api/admin/messages/[id] — marcar como lida/não lida
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = messagePatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const message = await setContactMessageRead(id, parsed.data.read)
    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, message })
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar a mensagem.' }, { status: 500 })
  }
}

// DELETE /api/admin/messages/[id] — excluir mensagem
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
  }
  try {
    const { id } = await params
    const deleted = await deleteContactMessage(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a mensagem.' }, { status: 500 })
  }
}
