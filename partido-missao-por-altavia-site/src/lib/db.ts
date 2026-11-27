import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Retorna o cliente Prisma quando a variável DATABASE_URL está configurada.
// Sem a variável (ex.: deploy na Vercel sem banco configurado), devolve null —
// e o site passa a usar o conteúdo embutido de src/lib/site-data.ts,
// evitando o erro "Environment variable not found: DATABASE_URL".
export function getDb(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}
