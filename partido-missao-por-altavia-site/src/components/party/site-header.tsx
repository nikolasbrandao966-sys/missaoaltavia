'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PartyLogo } from '@/components/party/logo'
import { ThemeToggle } from '@/components/party/theme-toggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/#inicio', label: 'Início' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#programa', label: 'Programa' },
  { href: '/#lideranca', label: 'Liderança' },
  { href: '/#noticias', label: 'Notícias' },
  { href: '/#candidaturas', label: 'Candidaturas' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full border-b transition-all',
        scrolled
          ? 'border-border bg-background/85 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-background/60 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/#inicio" className="flex items-center gap-2.5" aria-label="Página inicial do PMA">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border">
            <PartyLogo className="h-9 w-9" priority />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
              Missão por Altávia
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
              Partido · PMA
            </span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild className="hidden font-semibold sm:inline-flex">
            <Link href="/#filiacao">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Filie-se
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4 text-left">
                Missão por Altávia
              </SheetTitle>
              <nav aria-label="Menu móvel" className="mt-2 flex flex-col gap-1 px-4">
                {[
                  ...NAV_ITEMS,
                  { href: '/#filiacao', label: 'Filie-se' },
                  { href: '/#contato', label: 'Contato' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
