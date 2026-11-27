'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PartyLogo } from '@/components/party/logo'

export type PartyStatItem = {
  key: string
  label: string
  value: number
  suffix: string | null
}

function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    let frame: number

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  // Anos (2025) não recebem separador de milhar; contagens grandes, sim.
  const formatted = value >= 10000 ? display.toLocaleString('pt-BR') : String(display)
  return <span>{formatted}</span>
}

export function Hero({ stats }: { stats: PartyStatItem[] }) {
  return (
    <section id="inicio" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="hero-pattern absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-30%] left-[-10%] h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col gap-6"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/40 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
            República de Altávia · Fundada em 17 de março de 2025
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Uma{' '}
            <span className="relative inline-block text-emerald-700 dark:text-emerald-300">
              missão
              <svg
                viewBox="0 0 220 12"
                className="absolute -bottom-1 left-0 w-full text-amber-500"
                aria-hidden="true"
              >
                <path
                  d="M3 9 C60 1 160 1 217 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            nacional: desenvolvimento econômico e{' '}
            <span className="text-amber-600 dark:text-amber-400">nacionalismo</span> por Altávia.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            O Missão por Altávia é o maior partido da República de Altávia — micronação lusófona
            soberana e independente, enclave autônomo na região metropolitana de São Paulo. Com
            propostas detalhadas de desenvolvimento econômico e de nacionalismo, o partido conduz o
            programa Altávia 2027, com a escola virtual{' '}
            <strong className="font-semibold text-foreground">Sala Altávia</strong> para todos os
            cidadãos.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="text-base font-semibold">
              <Link href="/#filiacao">
                Filie-se ao PMA
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base font-semibold">
              <Link href="/#programa">Conheça o Altávia 2027</Link>
            </Button>
          </div>

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Mais de 3 Filiados</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Propriedade privada · Livre mercado</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Ética cristã · Liberdades individuais</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-sm"
        >
          <Card className="border-emerald-900/20 bg-card text-foreground shadow-xl">
            <CardContent className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-border">
                  <PartyLogo className="h-[72px] w-[72px]" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-snug text-foreground">
                    Partido Missão por Altávia
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    Programa Altávia 2027
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.key}
                    className="rounded-lg bg-emerald-900 p-4 text-emerald-50 dark:bg-emerald-900/80"
                  >
                    <p className="font-display text-2xl font-bold text-amber-300">
                      <CountUp value={stat.value} />
                      {stat.suffix ?? ''}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-emerald-100/90">{stat.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Fundado a partir do movimento político liderado por Nikolas, o Fundador. República de
                Altávia — micronação lusófona soberana, enclave na região metropolitana de São
                Paulo.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
