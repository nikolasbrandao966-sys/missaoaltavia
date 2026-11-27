import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'missao2027'

function isAdmin(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  return password !== null && password === ADMIN_PASSWORD
}

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

// GET /api/candidacies — lista pública de candidaturas
export async function GET() {
  try {
    const candidacies = await db.candidacy.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ candidacies })
  } catch (error) {
    console.error('Erro ao buscar candidaturas:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as candidaturas.' },
      { status: 500 }
    )
  }
}

// POST /api/candidacies — registrar candidatura (admin)
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = candidacySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const last = await db.candidacy.findFirst({ orderBy: { order: 'desc' } })
    const candidacy = await db.candidacy.create({
      data: {
        position: data.position,
        election: data.election,
        candidate: data.candidate,
        slogan: data.slogan ? data.slogan : null,
        proposal: data.proposal ? data.proposal : null,
        status: data.status,
        order: (last?.order ?? 0) + 1,
      },
    })

    return NextResponse.json({ ok: true, candidacy }, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar candidatura:', error)
    return NextResponse.json(
      { error: 'Não foi possível registrar a candidatura.' },
      { status: 500 }
    )
  }
}
