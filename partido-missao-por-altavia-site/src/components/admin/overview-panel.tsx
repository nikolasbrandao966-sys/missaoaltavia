'use client'

import { Megaphone, Mail, Newspaper, NotebookPen, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { adminFetch, type Overview, type AdminSession } from '@/components/admin/admin-api'

const CARDS: {
  key: keyof Pick<Overview, 'publishedNews' | 'draftNews' | 'candidacies' | 'members' | 'unreadMessages'>
  label: string
  icon: typeof Newspaper
  hint: string
}[] = [
  {
    key: 'publishedNews',
    label: 'Notícias publicadas',
    icon: Newspaper,
    hint: 'Visíveis na aba Notícias do site',
  },
  {
    key: 'draftNews',
    label: 'Rascunhos',
    icon: NotebookPen,
    hint: 'Registradas, ainda não publicadas',
  },
  {
    key: 'candidacies',
    label: 'Candidaturas',
    icon: Megaphone,
    hint: 'Divulgadas na aba Candidaturas',
  },
  {
    key: 'members',
    label: 'Filiados',
    icon: Users,
    hint: 'Cadastros recebidos pelo Filie-se',
  },
  {
    key: 'unreadMessages',
    label: 'Mensagens não lidas',
    icon: Mail,
    hint: 'Enviadas pelo formulário de Contato',
  },
]

export function OverviewPanel({ session }: { session: AdminSession }) {
  const { data, isLoading, isError, refetch } = useQuery<{ overview: Overview }>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/overview', session)
      if (!response.ok) throw new Error('Falha ao carregar o painel')
      return response.json()
    },
  })

  const overview = data?.overview

  return (
    <div className="flex flex-col gap-6">
      {overview && !overview.dbConnected ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTitle className="text-sm font-bold text-amber-700 dark:text-amber-400">
            Modo temporário — conecte o banco de dados para registros permanentes
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
            Sem a variável DATABASE_URL, tudo o que você registra aqui (notícias, candidaturas,
            filiados e mensagens) fica na memória temporária da hospedagem e pode ser perdido
            em novos deploys. Para gravar definitivamente, crie um banco gratuito no
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noreferrer"
              className="mx-1 font-semibold underline"
            >
              neon.tech
            </a>
            e siga o passo a passo da seção &quot;Como tornar os registros permanentes&quot; no
            arquivo DEPLOY-VERCEL.md do projeto. O site público continua funcionando de qualquer
            forma.
          </AlertDescription>
        </Alert>
      ) : null}
      {overview && overview.dbConnected ? (
        <Alert className="border-emerald-600/40 bg-emerald-600/10">
          <AlertTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Banco de dados conectado
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
            Tudo o que você registra neste painel — notícias, candidaturas, filiados e mensagens —
            é gravado permanentemente no banco de dados.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-destructive">Não foi possível carregar o painel.</p>
          </div>
        ) : isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col gap-3 p-6">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))
        ) : (
          CARDS.map(({ key, label, icon: Icon, hint }) => (
            <Card key={key} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-900/10 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {overview ? overview[key] : 0}
                  </p>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Como funciona este painel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Notícias</strong> — registre uma nova notícia,
            marque como publicada e ela aparece imediatamente na aba Notícias do site público,
            com página completa própria, resumo, categoria e busca.
          </p>
          <p>
            <strong className="text-foreground">Candidaturas</strong> — gerencie os cargos
            disputados pelo partido; tudo é divulgado na aba Candidaturas do site.
          </p>
          <p>
            <strong className="text-foreground">Filiados e Mensagens</strong> — acompanhe os
            cadastros do Filie-se e as mensagens recebidas pelo formulário de Contato.
          </p>
          <p className="text-xs">
            Os números acima atualizam automaticamente após cada alteração.{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => refetch()}
            >
              Atualizar agora
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
