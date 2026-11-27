import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const memberSchema = z.object({
  fullName: z
    .string()
    .min(5, 'Informe seu nome completo (nome e sobrenome).')
    .max(150),
  email: z.string().email('Informe um e-mail válido.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, 'Telefone inválido. Use apenas números, parênteses e traço.')
    .optional()
    .or(z.literal('')),
  city: z.string().min(2, 'Informe sua cidade.').max(120),
  region: z.string().min(2, 'Selecione sua região.').max(120),
  birthYear: z.coerce
    .number()
    .int('Ano de nascimento inválido.')
    .gte(1900, 'Ano de nascimento inválido.')
    .lte(2012, 'É preciso ter ao menos 16 anos para se filiar.')
    .optional(),
  motivation: z.string().max(1000, 'Sua mensagem deve ter até 1000 caracteres.').optional().or(z.literal('')),
})

// POST /api/members — cadastro de filiação
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = memberSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const member = await db.member.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : null,
        city: data.city.trim(),
        region: data.region,
        birthYear: data.birthYear ?? null,
        motivation: data.motivation ? data.motivation.trim() : null,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        protocol: member.id.slice(-8).toUpperCase(),
        message:
          'Filiação registrada! Nosso diretório regional entrará em contato para completar sua inscrição.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este e-mail já consta em nossa base de filiados.' },
        { status: 409 }
      )
    }
    console.error('Erro ao registrar filiação:', error)
    return NextResponse.json(
      { error: 'Não foi possível registrar sua filiação. Tente novamente.' },
      { status: 500 }
    )
  }
}
