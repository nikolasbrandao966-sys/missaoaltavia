'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Eye,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
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
  CardTitle,
} from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  adminFetch,
  AdminUnauthorizedError,
  type AdminSession,
} from '@/components/admin/admin-api'

type AdminNewsPost = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  published: boolean
  publishedAt: string
}

type NewsForm = {
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  published: boolean
}

const EMPTY_FORM: NewsForm = {
  title: '',
  category: 'Institucional',
  summary: '',
  content: '',
  author: 'Direção Nacional do PMA',
  featured: false,
  published: true,
}

const CATEGORY_SUGGESTIONS = ['Institucional', 'Programa', 'Educação', 'Campanha']

export function NewsManager({ session }: { session: AdminSession }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminNewsPost | null>(null)
  const [form, setForm] = useState<NewsForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ posts: AdminNewsPost[] }>({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/news', session)
      if (!response.ok) throw new Error('Falha ao carregar as notícias')
      return response.json()
    },
  })

  const posts = data?.posts ?? []

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(post: AdminNewsPost) {
    setEditing(post)
    setForm({
      title: post.title,
      category: post.category,
      summary: post.summary,
      content: post.content,
      author: post.author,
      featured: post.featured,
      published: post.published,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function update<K extends keyof NewsForm>(key: K, value: NewsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormError(null)
  }

  async function invalidateAll() {
    await queryClient.invalidateQueries({ queryKey: ['admin-news'] })
    await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    await queryClient.invalidateQueries({ queryKey: ['news'] })
  }

  async function handleSubmit() {
    if (form.title.trim().length < 5) {
      setFormError('O título deve ter ao menos 5 caracteres.')
      return
    }
    if (form.category.trim().length < 2) {
      setFormError('Informe a categoria (ex.: Institucional).')
      return
    }
    if (form.summary.trim().length < 10) {
      setFormError('O resumo deve ter ao menos 10 caracteres.')
      return
    }
    if (form.content.trim().length < 30) {
      setFormError('O conteúdo deve ter ao menos 30 caracteres.')
      return
    }
    if (form.author.trim().length < 2) {
      setFormError('Informe o autor.')
      return
    }

    setSaving(true)
    try {
      const isEditing = editing !== null
      const response = await adminFetch(
        isEditing ? `/api/admin/news/${editing.id}` : '/api/admin/news',
        session,
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify({
            title: form.title.trim(),
            category: form.category.trim(),
            summary: form.summary.trim(),
            content: form.content.trim(),
            author: form.author.trim(),
            featured: form.featured,
            published: form.published,
          }),
        }
      )
      const payload = await response.json()
      if (!response.ok) {
        setFormError(payload.error ?? 'Não foi possível salvar a notícia.')
        return
      }
      toast({
        title: isEditing ? 'Notícia atualizada!' : 'Notícia registrada!',
        description: form.published
          ? `${form.title.trim()} já está visível na aba Notícias do site.`
          : `${form.title.trim()} ficou salva como rascunho.`,
      })
      setDialogOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      await invalidateAll()
    } catch (error) {
      if (error instanceof AdminUnauthorizedError) return
      setFormError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(post: AdminNewsPost) {
    setBusyId(post.id)
    try {
      const response = await adminFetch(`/api/admin/news/${post.id}`, session, {
        method: 'PATCH',
        body: JSON.stringify({ published: !post.published }),
      })
      const payload = await response.json()
      if (!response.ok) {
        toast({
          title: 'Não foi possível alterar',
          description: payload.error ?? 'Tente novamente.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: post.published ? 'Notícia despublicada' : 'Notícia publicada!',
        description: post.published
          ? 'Ela saiu da aba Notícias do site e virou rascunho.'
          : `${post.title} já está visível na aba Notícias do site.`,
      })
      await invalidateAll()
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

  async function handleDelete(post: AdminNewsPost) {
    setBusyId(post.id)
    try {
      const response = await adminFetch(`/api/admin/news/${post.id}`, session, {
        method: 'DELETE',
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
      toast({ title: 'Notícia excluída.', description: post.title })
      await invalidateAll()
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
          <h2 className="font-display text-xl font-bold">Notícias do partido</h2>
          <p className="text-sm text-muted-foreground">
            {posts.length} registrada{posts.length === 1 ? '' : 's'} — publique, edite ou
            despublique comunicados da Direção Nacional.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full font-semibold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova notícia
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar as notícias.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col gap-3 p-6">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma notícia registrada ainda.
          </p>
          <Button onClick={openCreate} variant="outline" className="rounded-full font-semibold">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Registrar a primeira notícia
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-emerald-900/10 text-[11px] font-bold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
                  >
                    {post.category}
                  </Badge>
                  {post.published ? (
                    <Badge className="rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                      Publicada
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-amber-500 text-[11px] font-bold text-amber-950">
                      Rascunho
                    </Badge>
                  )}
                  {post.featured ? (
                    <Badge className="gap-1 rounded-full bg-amber-500/90 text-[11px] font-bold text-amber-950">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Destaque
                    </Badge>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(post.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 py-2">
                <CardTitle className="font-display text-base font-bold leading-snug">
                  {post.title}
                </CardTitle>
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Por {post.author} · /?noticia={post.slug}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-2 border-t pt-4">
                {post.published ? (
                  <Button asChild size="sm" variant="outline" className="rounded-full font-semibold">
                    <a href={`/?noticia=${post.slug}`} target="_blank" rel="noreferrer">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Ver no site
                    </a>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-semibold"
                  onClick={() => openEdit(post)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-semibold"
                  disabled={busyId === post.id}
                  onClick={() => togglePublished(post)}
                >
                  {busyId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {post.published ? 'Despublicar' : 'Publicar agora'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === post.id}
                    >
                      {busyId === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta notícia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{post.title}&quot; será removida definitivamente{post.published
                          ? ' da aba Notícias do site'
                          : ' dos rascunhos'}
                        . Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter a notícia</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(post)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display text-xl">
              {editing ? 'Editar notícia' : 'Registrar nova notícia'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Altere os campos e salve para atualizar a notícia.'
                : 'Notícia publicada aparece na aba Notícias do site com página completa própria.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="news-title">
                Título <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(event) => update('title', event.target.value.slice(0, 180))}
                placeholder="Ex.: Missão por Altávia lança a Sala Altávia"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="news-category">
                  Categoria <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="news-category"
                  value={form.category}
                  onChange={(event) => update('category', event.target.value.slice(0, 60))}
                  placeholder="Ex.: Institucional"
                  list="news-category-suggestions"
                />
                <datalist id="news-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="news-author">
                  Autor <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="news-author"
                  value={form.author}
                  onChange={(event) => update('author', event.target.value.slice(0, 120))}
                  placeholder="Ex.: Direção Nacional do PMA"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="news-summary">
                Resumo (aparece no cartão da notícia) <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Textarea
                id="news-summary"
                value={form.summary}
                onChange={(event) => update('summary', event.target.value.slice(0, 400))}
                placeholder="Um ou dois períodos resumindo o comunicado..."
                className="min-h-20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="news-content">
                Conteúdo completo <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Textarea
                id="news-content"
                value={form.content}
                onChange={(event) => update('content', event.target.value.slice(0, 20000))}
                placeholder="Texto completo da notícia. Separe os parágrafos com uma linha em branco..."
                className="min-h-64"
              />
              <p className="text-[11px] text-muted-foreground">
                Parágrafos separados por linha em branco; até 20.000 caracteres.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3.5">
                <div className="leading-tight">
                  <Label htmlFor="news-published" className="text-sm font-semibold">
                    Publicada no site
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Desligado = rascunho (invisível no site)
                  </p>
                </div>
                <Switch
                  id="news-published"
                  checked={form.published}
                  onCheckedChange={(value) => update('published', value)}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3.5">
                <div className="leading-tight">
                  <Label htmlFor="news-featured" className="text-sm font-semibold">
                    Notícia em destaque
                  </Label>
                  <p className="text-xs text-muted-foreground">Exibe o selo Destaque no cartão</p>
                </div>
                <Switch
                  id="news-featured"
                  checked={form.featured}
                  onCheckedChange={(value) => update('featured', value)}
                />
              </div>
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
                'Registrar notícia'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
