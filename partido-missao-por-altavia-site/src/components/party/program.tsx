import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BookOpen,
  GraduationCap,
  Landmark,
  Laptop,
  Leaf,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/party/section-heading'

const PILLARS = [
  {
    id: 'educacao',
    icon: GraduationCap,
    title: 'Educação — Sala Altávia, a escola virtual para todos',
    intro:
      'O carro-chefe do programa: uma plataforma online na qual os cidadãos terão atividades e aprenderão sobre todas as matérias.',
    proposals: [
      'Lançar a plataforma Sala Altávia, o projeto online no qual os cidadãos terão atividades e aprenderão sobre todas as matérias.',
      'Organizar o conteúdo em trilhas de estudo para todas as idades, da alfabetização à formação continuada.',
      'Garantir acesso aberto à plataforma a todos os cidadãos da República de Altávia.',
      'Incentivar a participação de Filiados como monitores voluntários da escola virtual.',
    ],
  },
  {
    id: 'economia',
    icon: TrendingUp,
    title: 'Economia — livre mercado e propriedade privada',
    intro:
      'O partido reúne propostas detalhadas de desenvolvimento econômico para a República, com o livre mercado como motor.',
    proposals: [
      'Garantir a propriedade privada como direito fundamental de todo cidadão altaviano.',
      'Manter o ambiente de livre mercado, livre de barreiras ao empreendedorismo nacional.',
      'Apoiar o surgimento de empresas e serviços altavianos, da cultura ao comércio digital.',
      'Estimular o desenvolvimento econômico da República com incentivo à produção e ao trabalho altaviano.',
    ],
  },
  {
    id: 'liberdades',
    icon: ShieldCheck,
    title: 'Liberdades individuais e ética cristã',
    intro: 'Os pilares civis e morais que fundamentam a República de Altávia desde 17 de março de 2025.',
    proposals: [
      'Defender as liberdades individuais de cada cidadão como garantia inegociável da vida nacional.',
      'Sustentar a ética cristã como fundamento ético da vida pública altaviana.',
      'Proteger a liberdade de consciência, de expressão e de associação em todo o território.',
      'Garantir igual consideração a todos os cidadãos perante as instituições da República.',
    ],
  },
  {
    id: 'cidadania-digital',
    icon: Laptop,
    title: 'Cidadania digital — a República online',
    intro:
      'Como micronação, a vida nacional de Altávia acontece também na internet — e o partido quer organizá-la de ponta a ponta.',
    proposals: [
      'Digitalizar os serviços ao cidadão da República em plataformas online.',
      'Manter canais digitais oficiais de comunicação e participação do partido e do governo.',
      'Promover a cultura digital altaviana em língua portuguesa.',
      'Organizar registros e documentos nacionais em meios digitais, à altura de uma micronação moderna.',
    ],
  },
  {
    id: 'nacionalismo',
    icon: Landmark,
    title: 'Nacionalismo e identidade nacional',
    intro:
      'Orgulho de ser altaviano: a soberania, a língua portuguesa e a cultura própria da República.',
    proposals: [
      'Fortalecer os símbolos e a identidade nacional da República de Altávia.',
      'Promover a cultura lusófona e as tradições da comunidade altaviana.',
      'Defender a soberania e a independência da micronação em todas as instâncias.',
      'Buscar o reconhecimento e a integração de Altávia com outras nações e micronações.',
    ],
  },
  {
    id: 'desenvolvimento',
    icon: Leaf,
    title: 'Desenvolvimento nacional — instituições e povo',
    intro:
      'Crescer com organização: mais cidadãos engajados, instituições fortes e o partido à frente da missão nacional.',
    proposals: [
      'Ampliar a base de Filiados do maior partido de Altávia em todas as regiões da República.',
      'Formar quadros do partido para os cargos e candidaturas da vida nacional.',
      'Consolidar a Sede Missão, no Estado de Nova Orlands, como polo de organização política e social.',
      'Preparar o partido para disputar as eleições nacionais com candidaturas próprias.',
    ],
  },
]

export function Program() {
  return (
    <section id="programa" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Programa Altávia 2027"
          title="Seis eixos para a República de Altávia"
          description="As propostas detalhadas de desenvolvimento econômico e de nacionalismo do Missão por Altávia, organizadas em seis eixos — com a escola virtual Sala Altávia como prioridade. Abra cada eixo e conheça as propostas."
        />

        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible defaultValue="educacao" className="space-y-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon
              return (
                <AccordionItem
                  key={pillar.id}
                  value={pillar.id}
                  className="scroll-mt-24 rounded-lg border bg-card px-5 shadow-sm data-[state=open]:border-emerald-600/40 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
                    <span className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-emerald-700 dark:text-emerald-400">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="font-display text-base font-bold leading-snug sm:text-lg">
                          {pillar.title}
                        </span>
                        <span className="hidden text-sm text-muted-foreground sm:block">
                          {pillar.intro}
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-0">
                    <p className="mb-4 text-sm text-muted-foreground sm:hidden">{pillar.intro}</p>
                    <ul className="grid gap-3">
                      {pillar.proposals.map((proposal) => (
                        <li key={proposal} className="flex items-start gap-3 text-sm leading-relaxed">
                          <Badge className="mt-0.5 shrink-0 bg-emerald-700 text-[10px] font-bold uppercase tracking-wide text-white">
                            Proposta
                          </Badge>
                          <span className="text-foreground/90">{proposal}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      Eixo do documento Altávia 2027 — consulta aberta nesta página e na Sede Missão,
                      no Estado de Nova Orlands.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
