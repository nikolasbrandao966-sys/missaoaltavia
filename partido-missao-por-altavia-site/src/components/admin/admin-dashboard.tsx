'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Database, ExternalLink, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminFetch, type Overview, type AdminSession } from '@/components/admin/admin-api'
import { OverviewPanel } from '@/components/admin/overview-panel'
import { NewsManager } from '@/components/admin/news-manager'
import { CandidaciesManager } from '@/components/admin/candidacies-manager'
import { MembersList } from '@/components/admin/members-list'
import { MessagesList } from '@/components/admin/messages-list'
import { PartyLogo } from '@/components/party/logo'

export function AdminDashboard({
  password,
  onUnauthorized,
}: {
  password: string
  onUnauthorized: () => void
}) {
  const session: AdminSession = { password, onUnauthorized }

  const { data } = useQuery<{ overview: Overview }>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/overview', session)
      if (!response.ok) throw new Error('Falha ao carregar o painel')
      return response.json()
    },
  })

  const dbConnected = data?.overview.dbConnected

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-emerald-950 text-emerald-50">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
              <PartyLogo className="h-9 w-9" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-white">
                Painel do Administrador
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Partido Missão por Altávia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dbConnected === true ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-800/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-100">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                Banco conectado — registros permanentes
              </span>
            ) : dbConnected === false ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-[11px] font-bold text-amber-950">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                Modo temporário — sem banco
              </span>
            ) : null}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-emerald-300/30 bg-transparent text-emerald-100 hover:bg-emerald-900 hover:text-white"
            >
              <Link href="/">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Ver o site
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUnauthorized}
              className="rounded-full border-emerald-300/30 bg-transparent font-semibold text-emerald-100 hover:bg-emerald-900 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Tabs defaultValue="painel">
          <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1 bg-muted">
            <TabsTrigger value="painel" className="rounded-full px-4">Painel</TabsTrigger>
            <TabsTrigger value="noticias" className="rounded-full px-4">Notícias</TabsTrigger>
            <TabsTrigger value="candidaturas" className="rounded-full px-4">Candidaturas</TabsTrigger>
            <TabsTrigger value="filiados" className="rounded-full px-4">Filiados</TabsTrigger>
            <TabsTrigger value="mensagens" className="rounded-full px-4">Mensagens</TabsTrigger>
          </TabsList>

          <TabsContent value="painel">
            <OverviewPanel session={session} />
          </TabsContent>
          <TabsContent value="noticias">
            <NewsManager session={session} />
          </TabsContent>
          <TabsContent value="candidaturas">
            <CandidaciesManager session={session} />
          </TabsContent>
          <TabsContent value="filiados">
            <MembersList session={session} />
          </TabsContent>
          <TabsContent value="mensagens">
            <MessagesList session={session} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
