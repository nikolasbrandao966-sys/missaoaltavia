'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { adminFetch, type AdminSession } from '@/components/admin/admin-api'

type AdminMember = {
  id: string
  fullName: string
  email: string
  phone: string | null
  city: string
  region: string
  birthYear: number | null
  motivation: string | null
  createdAt: string
}

export function MembersList({ session }: { session: AdminSession }) {
  const { data, isLoading, isError, refetch } = useQuery<{ members: AdminMember[] }>({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/members', session)
      if (!response.ok) throw new Error('Falha ao carregar os filiados')
      return response.json()
    },
  })

  const members = data?.members ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-bold">Filiados do partido</h2>
        <p className="text-sm text-muted-foreground">
          {members.length}{' '}
          {members.length === 1 ? 'cadastro recebido' : 'cadastros recebidos'} pelo formulário
          Filie-se do site.
        </p>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar os filiados.</p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma filiação recebida ainda.
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            Quando alguém se filiar pela seção Filie-se do site, o cadastro aparece aqui
            automaticamente.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filiado</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="whitespace-nowrap">Filiado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.phone ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.city} · {member.region}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(member.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {members.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          A lista é atualizada automaticamente a cada visita ao painel — ou{' '}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>
            atualize agora
          </button>
          .
        </p>
      ) : null}
    </div>
  )
}
