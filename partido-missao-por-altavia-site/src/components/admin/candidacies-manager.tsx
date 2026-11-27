'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  adminFetch,
  AdminUnauthorizedError,
  type AdminSession,
} from '@/components/admin/admin-api'

type Candidacy = {
  id: string
  position: string
  election: string
  candidate: string
  slogan: string | null
  proposal: string | null
  status: string
}

const STATUSES = ['Anunciada', 'Registrada', 'Em campanha'] as const

type CandidacyForm = {
  position: string
  election: string
  candidate: string
  slogan: string
  proposal: string
  status: (typeof STATUSES)[number]
}

const EMPTY_FORM: CandidacyForm = {
  position: '',
  election: '',
  candidate: '',
  slogan: '',
  proposal: '',
  status: 'Anunciada',
}

export function CandidaciesManager({ session }: { session: AdminSession }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Candidacy | null>(null)
  const [form, setForm] = useState<CandidacyForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ candidacies: Candidacy[] }>({
    queryKey: ['candidacies'],
    queryFn: async () => {
      const response = await fetch('/api/candidacies')
      if (!response.ok) throw new Error('Falha ao carregar candidaturas')
      return response.json()
    },
  })

  const candidacies = data?.candidacies ?? []

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(candidacy: Candidacy) {
    setEditing(candidacy)
    setForm({
      position: candidacy.position,
      election: candidacy.election,
      candidate: candidacy.candidate,
      slogan: candidacy.slogan ?? '',
      proposal: candidacy.proposal ?? '',
      status: (STATUSES as readonly string[]).includes(candidacy.status)
        ? (candidacy.status as CandidacyForm['status'])
        : 'Anunciada',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function update<K extends keyof CandidacyForm>(key: K, value: CandidacyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormError(null)
  }

  async function handleSubmit() {
    if (form.position.trim().length < 2) {
      setFormError('Informe o cargo disputado.')
      return
    }
    if (form.election.trim().length < 2) {
      setFormError('Informe o pleito (ex.: Eleições Nacionais de 2027).')
      return
    }
    if (form.candidate.trim().length < 3) {
      setFormError('Informe o nome do candidato.')
      return
    }

    setSaving(true)
    try {
      const isEditing = editing !== null
      const response = await adminFetch(
        isEditing ? `/api/candidacies/${editing.id}` : '/api/candidacies',
        session,
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify({
            position: form.position.trim(),
            election: form.election.trim(),
            candidate: form.candidate.trim(),
            slogan: form.slogan.trim(),
            proposal: form.proposal.trim(),
            status: form.status,
          }),
        }
      )
      const payload = await response.json()
      if (!response.ok) {
        setFormError(payload.error ?? 'Não foi possível salvar a candidatura.')
        return
      }
      toast({
        title: isEditing ? 'Candidatura atualizada!' : 'Candidatura registrada!',
        description: `${form.candidate.trim().split(' ')[0]} — ${form.position.trim()}.`,
      })
      setDialogOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      await queryClient.invalidateQueries({ queryKey: ['candidacies'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    } catch (error) {
      if (error instanceof AdminUnauthorizedError) return
      setFormError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(candidacy: Candidacy) {
    setBusyId(candidacy.id)
    try {
      const response = await adminFetch(
        `/api/candidacies/${candidacy.id}`,
        session,
        { method: 'DELETE' }
      )
      const payload = await response.json()
      if (!response.ok) {
        toast({
          title: 'Não foi possível excluir',
          description: payload.error ?? 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Candidatura excluída.', description: candidacy.position })
      await queryClient.invalidateQueries({ queryKey: ['candidacies'] })
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Candidaturas do partido</h2>
          <p className="text-sm text-muted-foreground">
            {candidacies.length} registrada{candidacies.length === 1 ? '' : 's'} — exibidas na aba
            Candidaturas do site público.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full font-semibold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova candidatura
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar as candidaturas.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : candidacies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma candidatura registrada até o momento.
          </p>
          <Button onClick={openCreate} variant="outline" className="rounded-full font-semibold">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Registrar a primeira candidatura
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {candidacies.map((candidacy) => (
            <div
              key={candidacy.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
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
              <div>
                <p className="font-display text-base font-bold leading-snug">
                  {candidacy.position}
                </p>
                <p className="text-sm font-semibold text-foreground">{candidacy.candidate}</p>
                {candidacy.slogan ? (
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    “{candidacy.slogan}”
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-semibold"
                  onClick={() => openEdit(candidacy)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === candidacy.id}
                    >
                      {busyId === candidacy.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta candidatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A candidatura de {candidacy.candidate} para {candidacy.position} será
                        removida da aba Candidaturas do site. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter a candidatura</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(candidacy)}
                      >
                        Excluir definitivamente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display text-xl">
              {editing ? 'Editar candidatura' : 'Registrar nova candidatura'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Altere os dados e salve para atualizar a candidatura.'
                : 'A candidatura aparece na aba Candidaturas do site público.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cand-position">
                  Cargo disputado <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="cand-position"
                  value={form.position}
                  onChange={(event) => update('position', event.target.value)}
                  placeholder="Ex.: Presidente da República de Altávia"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cand-election">
                  Pleito <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="cand-election"
                  value={form.election}
                  onChange={(event) => update('election', event.target.value)}
                  placeholder="Ex.: Eleições Nacionais de 2027"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cand-candidate">
                  Candidato <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="cand-candidate"
                  value={form.candidate}
                  onChange={(event) => update('candidate', event.target.value)}
                  placeholder="Ex.: Nikolas Brandão"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cand-status">Situação</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => update('status', value as CandidacyForm['status'])}
                >
                  <SelectTrigger id="cand-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cand-slogan">Slogan de campanha (opcional)</Label>
              <Input
                id="cand-slogan"
                value={form.slogan}
                onChange={(event) => update('slogan', event.target.value.slice(0, 160))}
                placeholder="Ex.: Uma missão por Altávia"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cand-proposal">Proposta resumida (opcional)</Label>
              <Textarea
                id="cand-proposal"
                value={form.proposal}
                onChange={(event) => update('proposal', event.target.value.slice(0, 1500))}
                placeholder="Principais compromissos do candidato na campanha..."
                className="min-h-24"
              />
            </div>

            {formError ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="font-semibold">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Salvando...
                </>
              ) : editing ? (
                'Salvar alterações'
              ) : (
                'Registrar candidatura'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
