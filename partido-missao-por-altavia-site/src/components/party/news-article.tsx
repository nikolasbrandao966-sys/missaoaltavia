import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeading } from '@/components/party/section-heading'

export type NewsArticlePost = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  publishedAt: Date
}

export type RelatedPost = {
  slug: string
  title: string
  category: string
  publishedAt: Date
}

export function NewsArticle({ post, others }: { post: NewsArticlePost; others: RelatedPost[] }) {
  const paragraphs = post.content.split('\n\n').filter(Boolean)
  const readingMinutes = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))

  return (
    <article className="pt-28 pb-20 sm:pt-32">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2 rounded-full font-semibold">
          <Link href="/#noticias">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para as notícias
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full bg-emerald-900/10 font-semibold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
          >
            {post.category}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {format(new Date(post.publishedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {readingMinutes} min de leitura
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-6 border-l-4 border-l-amber-500 pl-4 text-base font-medium leading-relaxed text-foreground/90 sm:text-lg">
          {post.summary}
        </p>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            PMA
          </span>
          <div className="flex flex-col leading-tight">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {post.author}
            </span>
            <span className="text-xs text-muted-foreground">Partido Missão por Altávia</span>
          </div>
        </div>

        <div className="mt-10 space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-5">
          <p className="text-sm font-medium text-foreground">
            Apoie a Missão por Altávia — o maior partido da República de Altávia.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full font-semibold">
              <Link href="/#filiacao">Filie-se ao PMA</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full font-semibold">
              <Link href="/#programa">Programa Altávia 2027</Link>
            </Button>
          </div>
        </div>

        {others.length > 0 ? (
          <section aria-labelledby="outras-noticias" className="mt-16">
            <SectionHeading
              align="left"
              className="mb-6"
              eyebrow="Continue lendo"
              title="Outras notícias"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((other) => (
                <Card key={other.slug} className="group transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-2 pb-2">
                    <Badge
                      variant="secondary"
                      className="w-fit rounded-full bg-emerald-900/10 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300"
                    >
                      {other.category}
                    </Badge>
                    <CardTitle className="text-base font-bold leading-snug">
                      <Link
                        href={`/?noticia=${other.slug}`}
                        className="transition-colors hover:text-emerald-700 dark:hover:text-emerald-300"
                      >
                        {other.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {format(new Date(other.publishedAt), 'dd/MM/yyyy')}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
