// Sincroniza o provider do prisma/schema.prisma com a DATABASE_URL detectada.
// - Com DATABASE_URL apontando para Postgres (ex.: Neon/Supabase), o schema é
//   ajustado para "postgresql" antes do `prisma generate` — nenhum ajuste
//   manual de código é necessário na Vercel.
// - Sem DATABASE_URL ou com URL SQLite (file:...), o schema permanece "sqlite".
// Roda no postinstall, antes de `prisma generate`.
import { readFileSync, writeFileSync } from 'node:fs'

const url = process.env.DATABASE_URL ?? ''
const isPostgres = url.startsWith('postgres://') || url.startsWith('postgresql://')

if (isPostgres) {
  const path = 'prisma/schema.prisma'
  const schema = readFileSync(path, 'utf8')
  if (schema.includes('provider = "sqlite"')) {
    writeFileSync(path, schema.replace('provider = "sqlite"', 'provider = "postgresql"'))
    console.log('DATABASE_URL Postgres detectada — provider do Prisma ajustado para postgresql.')
  }
} else {
  console.log('DATABASE_URL ausente ou SQLite — provider do Prisma permanece sqlite.')
}
