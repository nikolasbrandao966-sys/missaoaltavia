import { NextRequest } from 'next/server'

// Senha padrão da área do administrador — alterável pela variável ADMIN_PASSWORD.
const ADMIN_PASSWORD_DEFAULT = 'missao@2026'

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? ADMIN_PASSWORD_DEFAULT
}

// Verifica o cabeçalho x-admin-password enviado pela área do administrador.
export function isAdminRequest(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password !== null && password === getAdminPassword()
}
