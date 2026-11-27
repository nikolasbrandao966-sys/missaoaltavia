import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin-auth'
import { deleteCandidacy, updateCandidacy } from '@/lib/data'

const candidacySchema = z.object({
  position: z.string().trim().min(2, 'Informe o cargo disputado.').max(120),
  election: z.string().trim().min(2, 'Informe o pleito.').max(120),
  candidate: z.string().trim().min(3, 'Informe o nome do candidato.').max(150),
  slogan: z.string().trim().max(160, 'O slogan deve ter até 160 caracteres.').optional().or(z.literal('')),
  proposal: z
    .string()
    .trim()
    .max(1500, 'A proposta deve ter até 1500 caracteres.')
    .optional()
    .or(z.literal('')),
  status: z.enum(['Anunciada', 'Registrada', 'Em campanha'], {
    message: 'Situação inválida.',
  }),
})

// PUT /api/candidacies/[id] — editar candidatura (admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
    }

    const { id } = await params

    const body = await req.json()
    const parsed = candidacySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const candidacy = await updateCandidacy(id, {
      position: data.position,
      election: data.election,
      candidate: data.candidate,
      slogan: data.slogan ? data.slogan : null,
      proposal: data.proposal ? data.proposal : null,
      status: data.status,
    })

    if (!candidacy) {
      return NextResponse.json({ error: 'Candidatura não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, candidacy })
  } catch (error) {
    console.error('Erro ao editar candidatura:', error)
    return NextResponse.json({ error: 'Não foi possível editar a candidatura.' }, { status: 500 })
  }
}

// DELETE /api/candidacies/[id] — excluir candidatura (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
    }

    const { id } = await params
    const deleted = await deleteCandidacy(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Candidatura não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir candidatura:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a candidatura.' }, { status: 500 })
  }
}
