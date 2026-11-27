'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeading } from '@/components/party/section-heading'

type Candidacy = {
  id: string
  position: string
  election: string
  candidate: string
  slogan: string | null
  proposal: string | null
  status: string
}

export function CandidaturasSection() {
  const { data, isLoading, isError, refetch } = useQuery<{ candidacies: Candidacy[] }>({
    queryKey: ['candidacies'],
    queryFn: async () => {
      const response = await fetch('/api/candidacies')
      if (!response.ok) throw new Error('Falha ao carregar candidaturas')
      return response.json()
    },
  })

  const candidacies = data?.candidacies ?? []

  return (
    <section id="candidaturas" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            align="left"
            className="mb-0"
            eyebrow="Candidaturas"
            title="O partido nas urnas da República"
            description="As candidaturas oficiais do Missão por Altávia nas eleições da República de Altávia serão divulgadas aqui — com cargo, candidato, pleito e situação da campanha."
          />
          <div className="shrink-0">
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/admin">Área do administrador</Link>
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
            <p className="text-sm text-destructive">
              Não foi possível carregar as candidaturas agora. Tente novamente.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidacies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma candidatura registrada até o momento.
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              As candidaturas oficiais do Missão por Altávia nas eleições da República de Altávia
              serão divulgadas nesta página. A administração do partido registra cada candidatura
              pela área do administrador.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidacies.map((candidacy) => (
              <Card
                key={candidacy.id}
                className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-emerald-900/10 text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
                    >
                      {candidacy.election}
                    </Badge>
                    <Badge
                      className={
                        candidacy.status === 'Anunciada'
                          ? 'rounded-full bg-amber-500 text-[11px] font-bold text-amber-950'
                          : 'rounded-full bg-emerald-700 text-[11px] font-bold text-white'
                      }
                    >
                      {candidacy.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-lg font-bold leading-snug">
                    {candidacy.position}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm font-semibold text-foreground">{candidacy.candidate}</p>
                  {candidacy.slogan ? (
                    <p className="text-sm italic text-muted-foreground">“{candidacy.slogan}”</p>
                  ) : null}
                  {candidacy.proposal ? (
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {candidacy.proposal}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
