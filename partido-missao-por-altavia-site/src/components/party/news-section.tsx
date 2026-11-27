'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, CalendarDays, Newspaper, Search, Star, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeading } from '@/components/party/section-heading'

type NewsPost = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  publishedAt: string
}

// Categorias base + as que surgirem nas notícias publicadas pela administração
const BASE_CATEGORIES = ['Todas', 'Institucional', 'Programa', 'Educação']

export function NewsSection() {
  const [category, setCategory] = useState('Todas')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce simples da busca por texto
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, refetch } = useQuery<{ posts: NewsPost[] }>({
    queryKey: ['news', category, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category !== 'Todas') params.set('category', category)
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim())
      const response = await fetch(`/api/news?${params.toString()}`)
      if (!response.ok) throw new Error('Falha ao carregar notícias')
      return response.json()
    },
  })

  const posts = data?.posts ?? []

  const categories = useMemo(
    () => Array.from(new Set([...BASE_CATEGORIES, ...posts.map((post) => post.category)])),
    [posts]
  )

  return (
    <section id="noticias" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Notícias"
          title="A Missão em movimento"
          description="Comunicados oficiais da Direção Nacional do Missão por Altávia — do programa Altávia 2027 à Sala Altávia. Cada notícia tem página completa própria."
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filtrar notícias por categoria" className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Button
                key={item}
                role="tab"
                aria-selected={category === item}
                variant={category === item ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(item)}
                className="h-9 rounded-full px-4 text-xs font-semibold"
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar em notícias..."
              className="h-10 rounded-full pl-9"
              aria-label="Buscar notícias por palavra-chave"
            />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
            <p className="text-sm text-destructive">
              Não foi possível carregar as notícias agora. Verifique sua conexão e tente de novo.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-11/12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-9/12" />
                  <Skeleton className="h-9 w-44 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma notícia encontrada para esta busca.
            </p>
            <p className="text-xs text-muted-foreground">
              Tente outra palavra ou selecione a aba &quot;Todas&quot;.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="group flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-emerald-900/10 font-semibold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
                  >
                    {post.category}
                  </Badge>
                  {post.featured ? (
                    <Badge className="gap-1 rounded-full bg-amber-500 text-[11px] font-bold text-amber-950">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Destaque
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {format(new Date(post.publishedAt), 'dd/MM/yyyy')}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <h3 className="font-display text-lg font-bold leading-snug text-foreground">
                    {post.title}
                  </h3>
                  <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {post.summary}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{post.author}</span>
                  </span>
                  <Button asChild size="sm" className="shrink-0 rounded-full font-semibold">
                    <Link href={`/?noticia=${post.slug}`}>
                      Ler notícia
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
