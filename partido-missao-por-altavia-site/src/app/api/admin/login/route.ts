import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminPassword } from '@/lib/admin-auth'

const loginSchema = z.object({
  password: z.string().min(1, 'Informe a senha do administrador.'),
})

// POST /api/admin/login — validar senha do administrador
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Informe a senha do administrador.' }, { status: 400 })
    }

    if (parsed.data.password !== getAdminPassword()) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro no login do administrador:', error)
    return NextResponse.json({ error: 'Não foi possível validar a senha.' }, { status: 500 })
  }
}
