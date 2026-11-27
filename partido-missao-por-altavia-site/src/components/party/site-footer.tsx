import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PartyLogo } from '@/components/party/logo'

const NAV_LINKS = [
  { href: '/#inicio', label: 'Início' },
  { href: '/#sobre', label: 'Sobre o partido' },
  { href: '/#programa', label: 'Programa Altávia 2027' },
  { href: '/#lideranca', label: 'Liderança' },
]

const INFO_LINKS = [
  { href: '/#noticias', label: 'Notícias' },
  { href: '/#candidaturas', label: 'Candidaturas' },
  { href: '/#filiacao', label: 'Filie-se' },
  { href: '/#contato', label: 'Contato' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-emerald-950 text-emerald-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white">
                <PartyLogo className="h-11 w-11" />
              </span>
              <div className="leading-tight">
                <p className="font-display text-lg font-bold text-white">Missão por Altávia</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Partido · PMA
                </p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-emerald-100/80">
              Partido político da República de Altávia — micronação lusófona soberana e independente,
              enclave autônomo na região metropolitana de São Paulo, fundada em 17 de março de 2025.
              O maior partido da República, com mais de 3 Filiados.
            </p>
          </div>

          <nav aria-label="Links do rodapé sobre o partido">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              O partido
            </p>
            <ul className="flex flex-col gap-2.5 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-emerald-100/85 transition-colors hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Links do rodapé de participação">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              Participe
            </p>
            <ul className="flex flex-col gap-2.5 text-sm">
              {INFO_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-emerald-100/85 transition-colors hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              Sede Missão
            </p>
            <address className="flex flex-col gap-2.5 text-sm not-italic text-emerald-100/85">
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                <span>
                  Rua Jesus o Bom Pastor, 01 — Centro
                  <br />
                  Estado de Nova Orlands
                  <br />
                  República de Altávia
                </span>
              </span>
            </address>
          </div>
        </div>

        <Separator className="my-8 bg-emerald-800" />

        <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-emerald-100/70 sm:flex-row sm:text-left">
          <p>
            © {year} Partido Missão por Altávia (PMA) — República de Altávia. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
