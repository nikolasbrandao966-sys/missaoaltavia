import { getNewsBySlug, getStats, listNews } from '@/lib/data'
import { SiteHeader } from '@/components/party/site-header'
import { Hero } from '@/components/party/hero'
import { About } from '@/components/party/about'
import { Program } from '@/components/party/program'
import { Leadership } from '@/components/party/leadership'
import { NewsSection } from '@/components/party/news-section'
import { NewsArticle } from '@/components/party/news-article'
import { CandidaturasSection } from '@/components/party/candidaturas-section'
import { JoinSection } from '@/components/party/join-section'
import { ContactSection } from '@/components/party/contact-section'
import { SiteFooter } from '@/components/party/site-footer'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const slug = typeof params.noticia === 'string' ? params.noticia : undefined

  // Sub-página de notícia: /?noticia=slug
  if (slug) {
    const post = await getNewsBySlug(slug)
    if (post) {
      const others = await listNews({ excludeSlug: post.slug, take: 3 })

      return (
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            <NewsArticle post={post} others={others} />
          </main>
          <SiteFooter />
        </div>
      )
    }
  }

  // Página inicial completa
  const stats = await getStats()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero stats={stats} />
        <About />
        <Program />
        <Leadership />
        <NewsSection />
        <CandidaturasSection />
        <JoinSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  )
}
