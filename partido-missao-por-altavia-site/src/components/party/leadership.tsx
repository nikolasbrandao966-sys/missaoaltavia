import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/party/section-heading'
import { PartyLogo } from '@/components/party/logo'

const LEADERS = [
  {
    name: 'Nikolas Brandão',
    role: 'Presidente Nacional',
    bio: 'Líder do movimento político que deu origem ao Missão por Altávia — Nikolas, o Fundador — e Presidente Nacional do partido. Conduz o programa Altávia 2027 e as propostas detalhadas de desenvolvimento econômico e de nacionalismo para a República.',
    initials: 'NB',
    tone: 'bg-emerald-700',
  },
  {
    name: 'Gabriel Augusto',
    role: 'Vice-Presidente',
    bio: 'Vice-Presidente do Missão por Altávia, integrante da Direção Nacional do partido ao lado do Presidente Nikolas Brandão.',
    initials: 'GA',
    tone: 'bg-amber-600',
  },
]

export function Leadership() {
  return (
    <section id="lideranca" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Liderança"
          title="Direção Nacional do partido"
          description="O Missão por Altávia surgiu de um movimento político liderado por Nikolas, o Fundador. Hoje, a Direção Nacional é formada pelo Presidente Nacional e pelo Vice-Presidente."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 lg:max-w-3xl lg:mx-auto">
          {LEADERS.map((leader) => (
            <Card key={leader.name} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                <Avatar className="h-14 w-14 border-2 border-border shadow-sm">
                  <AvatarFallback
                    className={`${leader.tone} font-display text-base font-bold text-white`}
                  >
                    {leader.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-base font-bold leading-tight">{leader.name}</h3>
                  <Badge
                    variant="outline"
                    className="w-fit border-amber-600/40 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
                  >
                    {leader.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {leader.bio}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-4 rounded-xl border bg-card px-6 py-5 shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
              <PartyLogo className="h-12 w-12" />
            </span>
            <div className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Missão por Altávia</p>
              <p>Filiados e apoiadores podem conferir a base partidária na seção Filie-se.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
