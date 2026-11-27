import { Eye, HeartHandshake, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/party/section-heading'

const PRINCIPLES = [
  'Propriedade privada',
  'Livre mercado',
  'Ética cristã',
  'Liberdades individuais',
  'Desenvolvimento econômico',
  'Nacionalismo',
  'Sala Altávia',
  'Programa Altávia 2027',
]

export function About() {
  return (
    <section id="sobre" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Quem somos"
          title="O maior partido da República de Altávia"
          description="O Missão por Altávia surgiu de um movimento político, liderado por Nikolas, o Fundador. O partido reúne propostas detalhadas de desenvolvimento econômico e de nacionalismo — e conta com mais de 3 Filiados, a maior base de Altávia."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-t-4 border-t-emerald-600 transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <Target className="mb-2 h-8 w-8 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <CardTitle className="font-display text-xl">Missão</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Organizar a vida política da República de Altávia com propostas detalhadas de
              desenvolvimento econômico e de nacionalismo, dando continuidade ao movimento político
              fundado por Nikolas, o Fundador — e ampliando a base de Filiados, hoje a maior da
              República.
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <Eye className="mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <CardTitle className="font-display text-xl">Visão</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Aplicar o programa Altávia 2027 em toda a República de Altávia — com destaque para a
              escola virtual Sala Altávia, que levará atividades e o estudo de todas as matérias a
              todos os cidadãos da micronação lusófona soberana.
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-800 dark:border-t-emerald-300 transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <HeartHandshake className="mb-2 h-8 w-8 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <CardTitle className="font-display text-xl">Valores</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              A defesa da propriedade privada, o livre mercado, a ética cristã e a garantia das
              liberdades individuais — pilares da República de Altávia desde a sua fundação, em 17
              de março de 2025.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-center text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Fundamentos que atravessam todas as nossas bandeiras
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {PRINCIPLES.map((principle) => (
              <li key={principle}>
                <Badge
                  variant="secondary"
                  className="rounded-full px-4 py-1.5 text-xs font-medium"
                >
                  {principle}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
