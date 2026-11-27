'use client'

import { useState } from 'react'
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { SectionHeading } from '@/components/party/section-heading'

type JoinForm = {
  fullName: string
  email: string
  phone: string
  city: string
  region: string
  birthYear: string
  motivation: string
  acceptTerms: boolean
}

export function JoinSection() {
  const { toast } = useToast()
  const [form, setForm] = useState<JoinForm>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    region: '',
    birthYear: '',
    motivation: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof JoinForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [protocol, setProtocol] = useState<string | null>(null)

  function update<K extends keyof JoinForm>(key: K, value: JoinForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: Partial<Record<keyof JoinForm, string>> = {}

    if (form.fullName.trim().length < 5) {
      next.fullName = 'Informe seu nome completo (nome e sobrenome).'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Informe um e-mail válido.'
    }
    if (form.phone.trim() && !/^\+?[\d\s()-]{8,20}$/.test(form.phone.trim())) {
      next.phone = 'Telefone inválido — use apenas números, parênteses e traço.'
    }
    if (form.city.trim().length < 2) {
      next.city = 'Informe sua cidade.'
    }
    if (!form.region.trim()) {
      next.region = 'Informe seu estado ou região da República.'
    }
    if (form.birthYear.trim()) {
      const year = Number(form.birthYear)
      if (!Number.isInteger(year) || year < 1900 || year > 2012) {
        next.birthYear = 'Ano entre 1900 e 2012 (filiação a partir de 16 anos).'
      }
    }
    if (form.motivation.length > 1000) {
      next.motivation = 'Máximo de 1000 caracteres.'
    }
    if (!form.acceptTerms) {
      next.acceptTerms = 'É preciso concordar com o estatuto para concluir a filiação.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          city: form.city.trim(),
          region: form.region.trim(),
          birthYear: form.birthYear.trim() ? Number(form.birthYear) : undefined,
          motivation: form.motivation.trim() || undefined,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (payload.error) {
          toast({ title: 'Não foi possível concluir', description: payload.error, variant: 'destructive' })
        } else {
          toast({ title: 'Erro inesperado', description: 'Tente novamente em instantes.', variant: 'destructive' })
        }
        return
      }

      setProtocol(payload.protocol)
      toast({ title: 'Bem-vindo à Missão!', description: payload.message })
    } catch {
      toast({
        title: 'Erro de conexão',
        description: 'Verifique a internet e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (protocol) {
    return (
      <section id="filiacao" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Card className="mx-auto max-w-xl text-center shadow-lg">
            <CardHeader className="items-center gap-4 pb-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
              </span>
              <CardTitle className="font-display text-2xl">Filiação registrada!</CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm leading-relaxed">
                A Direção Nacional do partido entrará em contato para completar a inscrição. Guarde
                seu protocolo de filiação:
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pb-8">
              <Badge className="rounded-lg bg-emerald-700 px-4 py-2 font-mono text-base font-bold tracking-widest text-white">
                PMA-{protocol}
              </Badge>
              <Button variant="outline" className="font-semibold" onClick={() => {
                setProtocol(null)
                setForm({
                  fullName: '',
                  email: '',
                  phone: '',
                  city: '',
                  region: '',
                  birthYear: '',
                  motivation: '',
                  acceptTerms: false,
                })
              }}>
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Indicar outro filiado
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="filiacao" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <SectionHeading
              align="left"
              className="mb-0"
              eyebrow="Filie-se"
              title="Filie-se ao maior partido da República de Altávia"
              description="A filiação é aberta a todos os cidadãos de Altávia. Ao se filiar, você reforça a maior base partidária da micronação e acompanha de perto o programa Altávia 2027."
            />
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              {[
                'Vínculo direto com a maior base partidária da República',
                'Acesso às novidades do programa Altávia 2027 e da Sala Altávia',
                'Participação na vida política e nas candidaturas do partido',
                'Contato direto com a Direção Nacional — o partido acompanha cada novo Filiado',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-xl">Formulário de filiação</CardTitle>
              <CardDescription>
                Preencha com atenção — a Direção Nacional usa estes dados para registrar sua
                filiação e organizar a base do partido.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="join-name">
                  Nome completo <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="join-name"
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  placeholder="Ex.: Maria da Silva Prado"
                  autoComplete="name"
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName ? <ErrorText>{errors.fullName}</ErrorText> : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-email">
                    E-mail <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="join-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="voce@exemplo.org"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email ? <ErrorText>{errors.email}</ErrorText> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-phone">Telefone (opcional)</Label>
                  <Input
                    id="join-phone"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    placeholder="(00) 90000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone ? <ErrorText>{errors.phone}</ErrorText> : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-city">
                    Cidade <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="join-city"
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                    aria-invalid={!!errors.city}
                  />
                  {errors.city ? <ErrorText>{errors.city}</ErrorText> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-region">
                    Estado / região da República <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="join-region"
                    value={form.region}
                    onChange={(event) => update('region', event.target.value)}
                    placeholder="Ex.: Estado de Nova Orlands"
                    aria-invalid={!!errors.region}
                  />
                  {errors.region ? <ErrorText>{errors.region}</ErrorText> : null}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="join-birth">Ano de nascimento (opcional)</Label>
                <Input
                  id="join-birth"
                  value={form.birthYear}
                  onChange={(event) => update('birthYear', event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1985"
                  inputMode="numeric"
                  className="sm:max-w-[200px]"
                  aria-invalid={!!errors.birthYear}
                />
                {errors.birthYear ? <ErrorText>{errors.birthYear}</ErrorText> : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="join-motivation">
                  Por que você quer militar na Missão? (opcional)
                </Label>
                <Textarea
                  id="join-motivation"
                  value={form.motivation}
                  onChange={(event) => update('motivation', event.target.value.slice(0, 1000))}
                  placeholder="Conte em poucas linhas o que traz você até aqui..."
                  className="min-h-28"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.motivation.length}/1000
                </p>
                {errors.motivation ? <ErrorText>{errors.motivation}</ErrorText> : null}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="join-terms"
                  className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground"
                >
                  <Checkbox
                    id="join-terms"
                    checked={form.acceptTerms}
                    onCheckedChange={(checked) => update('acceptTerms', checked === true)}
                    aria-invalid={!!errors.acceptTerms}
                  />
                  <span>
                    Li e concordo com o Estatuto do PMA e com a Carta de Princípios da Missão por
                    Altávia.{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </span>
                </label>
                {errors.acceptTerms ? <ErrorText>{errors.acceptTerms}</ErrorText> : null}
              </div>

              <Button
                size="lg"
                className="w-full text-base font-semibold"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Registrando...
                  </>
                ) : (
                  'Concluir filiação'
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Seus dados são usados exclusivamente para o registro da sua filiação junto à Direção
                Nacional do Missão por Altávia.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function ErrorText({ children }: { children: string }) {
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  )
}
