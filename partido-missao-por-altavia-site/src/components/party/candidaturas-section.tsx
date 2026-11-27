'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Loader2, Lock, LogOut, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SectionHeading } from '@/components/party/section-heading'

type Candidacy = {
  id: string
  position: string
  election: string
  candidate: string
  slogan: string | null
  proposal: string | null
  status: string
  order: number
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

export function CandidaturasSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Estado do administrador
  const [adminPassword, setAdminPassword] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Formulário de candidatura (criação/edição — somente admin)
  const [form, setForm] = useState<CandidacyForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ candidacies: Candidacy[] }>({
    queryKey: ['candidacies'],
    queryFn: async () => {
      const response = await fetch('/api/candidacies')
      if (!response.ok) throw new Error('Falha ao carregar candidaturas')
      return response.json()
    },
  })

  const candidacies = data?.candidacies ?? []

  async function handleLogin() {
    setLoginError(null)
    if (!loginPassword.trim()) {
      setLoginError('Informe a senha do administrador.')
      return
    }
    setLoginLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword.trim() }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setLoginError(payload.error ?? 'Senha incorreta.')
        return
      }
      setAdminPassword(loginPassword.trim())
      setLoginOpen(false)
      setLoginPassword('')
      toast({ title: 'Modo administrador ativado' })
    } catch {
      setLoginError('Erro de conexão. Tente novamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  function update<K extends keyof CandidacyForm>(key: K, value: CandidacyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormError(null)
  }

  function startEdit(candidacy: Candidacy) {
    setEditingId(candidacy.id)
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
    document.getElementById('candidatura-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit() {
    if (!adminPassword) return

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
      const isEditing = editingId !== null
      const response = await fetch(isEditing ? `/api/candidacies/${editingId}` : '/api/candidacies', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          position: form.position.trim(),
          election: form.election.trim(),
          candidate: form.candidate.trim(),
          slogan: form.slogan.trim(),
          proposal: form.proposal.trim(),
          status: form.status,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Sessão expirada',
            description: 'Faça login novamente como administrador.',
            variant: 'destructive',
          })
          setAdminPassword(null)
        } else {
          setFormError(payload.error ?? 'Não foi possível salvar a candidatura.')
        }
        return
      }

      toast({
        title: isEditing ? 'Candidatura atualizada!' : 'Candidatura registrada!',
        description: `${form.candidate.trim().split(' ')[0]} — ${form.position.trim()}.`,
      })
      resetForm()
      await queryClient.invalidateQueries({ queryKey: ['candidacies'] })
    } catch {
      setFormError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!adminPassword) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/candidacies/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      })
      const payload = await response.json()
      if (!response.ok) {
        toast({
          title: 'Não foi possível excluir',
          description: payload.error ?? 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Candidatura excluída.' })
      if (editingId === id) resetForm()
      await queryClient.invalidateQueries({ queryKey: ['candidacies'] })
    } catch {
      toast({ title: 'Erro de conexão', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

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
            {adminPassword ? (
              <Button
                variant="outline"
                className="rounded-full font-semibold"
                onClick={() => {
                  setAdminPassword(null)
                  resetForm()
                  toast({ title: 'Modo administrador encerrado.' })
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair do modo admin
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-full font-semibold"
                onClick={() => {
                  setLoginError(null)
                  setLoginOpen(true)
                }}
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Área do administrador
              </Button>
            )}
          </div>
        </div>

        {adminPassword ? (
          <Card className="mb-8 border-emerald-600/40 shadow-md">
            <CardHeader id="candidatura-form" className="scroll-mt-28 space-y-1.5">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <BadgeCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                {editingId ? 'Editar candidatura' : 'Registrar nova candidatura'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {editingId
                  ? 'Altere os dados e salve para atualizar a candidatura.'
                  : 'Preencha os dados da candidatura para divulgá-la na página pública.'}
              </p>
            </CardHeader>
            <CardContent className="grid gap-5">
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

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubmit} disabled={saving} className="font-semibold">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Salvando...
                    </>
                  ) : editingId ? (
                    'Salvar alterações'
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Registrar candidatura
                    </>
                  )}
                </Button>
                {editingId ? (
                  <Button variant="ghost" onClick={resetForm} className="font-semibold">
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

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
              serão divulgadas nesta página. A administração do partido registra cada candidatura pela
              área do administrador.
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

                  {adminPassword ? (
                    <div className="mt-auto flex items-center gap-2 border-t pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-semibold"
                        onClick={() => startEdit(candidacy)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === candidacy.id}
                        onClick={() => handleDelete(candidacy.id)}
                      >
                        {deletingId === candidacy.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={loginOpen}
        onOpenChange={(open) => {
          if (!open) {
            setLoginOpen(false)
            setLoginError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-left text-xl">
              <Lock className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              Área do administrador
            </DialogTitle>
            <DialogDescription className="text-left">
              Acesso restrito à Direção Nacional do Missão por Altávia. Informe a senha de
              administrador para registrar, editar e excluir candidaturas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Senha do administrador</Label>
              <Input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleLogin()
                }}
              />
            </div>
            {loginError ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {loginError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLoginOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin} disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Validando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
