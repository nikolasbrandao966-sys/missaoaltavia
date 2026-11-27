'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCheck, Loader2, Mail, MailOpen, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  adminFetch,
  AdminUnauthorizedError,
  type AdminSession,
} from '@/components/admin/admin-api'

type AdminContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

export function MessagesList({ session }: { session: AdminSession }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ messages: AdminContactMessage[] }>({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/messages', session)
      if (!response.ok) throw new Error('Falha ao carregar as mensagens')
      return response.json()
    },
  })

  const messages = data?.messages ?? []

  async function toggleRead(message: AdminContactMessage) {
    setBusyId(message.id)
    try {
      const response = await adminFetch(`/api/admin/messages/${message.id}`, session, {
        method: 'PATCH',
        body: JSON.stringify({ read: !message.read }),
      })
      if (!response.ok) {
        toast({
          title: 'Não foi possível atualizar',
          description: 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    } catch (error) {
      if (error instanceof AdminUnauthorizedError) return
      toast({
        title: 'Erro de conexão',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(message: AdminContactMessage) {
    setBusyId(message.id)
    try {
      const response = await adminFetch(`/api/admin/messages/${message.id}`, session, {
        method: 'DELETE',
      })
      if (!response.ok) {
        toast({
          title: 'Não foi possível excluir',
          description: 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Mensagem excluída.' })
      await queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    } catch (error) {
      if (error instanceof AdminUnauthorizedError) return
      toast({
        title: 'Erro de conexão',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-bold">Mensagens de contato</h2>
        <p className="text-sm text-muted-foreground">
          {messages.length}{' '}
          {messages.length === 1 ? 'mensagem recebida' : 'mensagens recebidas'} pelo formulário
          de Contato do site.
        </p>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar as mensagens.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col gap-3 p-6">
                <Skeleton className="h-5 w-36 rounded-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Mail className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma mensagem recebida ainda.
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            As mensagens enviadas pelo formulário de Contato do site aparecem aqui
            automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={message.read ? '' : 'border-emerald-600/50 shadow-md'}
            >
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-emerald-900/10 text-[11px] font-bold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
                  >
                    {message.subject}
                  </Badge>
                  {message.read ? (
                    <Badge variant="outline" className="rounded-full text-[11px]">
                      <MailOpen className="mr-1 h-3 w-3" aria-hidden="true" />
                      Lida
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-amber-500 text-[11px] font-bold text-amber-950">
                      <Mail className="mr-1 h-3 w-3" aria-hidden="true" />
                      Não lida
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 py-2">
                <p className="text-sm font-semibold">{message.name}</p>
                <a
                  href={`mailto:${message.email}`}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  {message.email}
                </a>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {message.message}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-semibold"
                  disabled={busyId === message.id}
                  onClick={() => toggleRead(message)}
                >
                  {busyId === message.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : message.read ? (
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {message.read ? 'Marcar como não lida' : 'Marcar como lida'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === message.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta mensagem?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A mensagem de {message.name} será removida definitivamente. Esta ação
                        não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter a mensagem</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(message)}
                      >
                        Excluir definitivamente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
