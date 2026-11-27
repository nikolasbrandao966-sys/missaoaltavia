import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const contactSchema = z.object({
  name: z.string().min(3, 'Informe seu nome.').max(120),
  email: z.string().email('Informe um e-mail válido.'),
  subject: z.enum(
    ['Filiação', 'Imprensa', 'Voluntariado', 'Doações', 'Ouvidoria', 'Outro'],
    { message: 'Selecione um assunto válido.' }
  ),
  message: z.string().min(10, 'Escreva sua mensagem (ao menos 10 caracteres).').max(2000),
})

// POST /api/contact — mensagem de contato
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    await db.contactMessage.create({
      data: {
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        subject: parsed.data.subject,
        message: parsed.data.message.trim(),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'Mensagem recebida! Nossa equipe de comunicação responde em até 2 dias úteis.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar mensagem de contato:', error)
    return NextResponse.json(
      { error: 'Não foi possível enviar sua mensagem. Tente novamente.' },
      { status: 500 }
    )
  }
}
