'use client'

import { useState } from 'react'
import { Loader2, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { SectionHeading } from '@/components/party/section-heading'

const SUBJECTS = [
  'Filiação',
  'Imprensa',
  'Voluntariado',
  'Ouvidoria',
  'Outro',
] as const

type ContactForm = {
  name: string
  email: string
  subject: string
  message: string
}

export function ContactSection() {
  const { toast } = useToast()
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: Partial<Record<keyof ContactForm, string>> = {}
    if (form.name.trim().length < 3) next.name = 'Informe seu nome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.'
    if (!form.subject) next.subject = 'Selecione um assunto.'
    if (form.message.trim().length < 10) next.message = 'Sua mensagem precisa de ao menos 10 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast({
          title: 'Não foi possível enviar',
          description: payload.error ?? 'Tente novamente em instantes.',
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Mensagem recebida!', description: payload.message })
      setForm({ name: '', email: '', subject: '', message: '' })
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

  return (
    <section id="contato" className="scroll-mt-24 border-t bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Fale com a gente"
          title="A Sede Missão está de portas abertas"
          description="Imprensa, dúvidas sobre filiação, voluntariado e ouvidoria: escolha o assunto e envie sua mensagem pelo formulário."
        />

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col gap-4">
            <Card className="border-l-4 border-l-emerald-600">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-emerald-700 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-semibold text-foreground">Sede Missão</p>
                  <p className="text-muted-foreground">
                    Rua Jesus o Bom Pastor, 01 — Centro
                    <br />
                    Estado de Nova Orlands
                    <br />
                    República de Altávia
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-amber-600 dark:text-amber-400">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-semibold text-foreground">República de Altávia</p>
                  <p className="text-muted-foreground">
                    Micronação lusófona soberana e independente, enclave autônomo na região
                    metropolitana de São Paulo. Fundada em 17 de março de 2025.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-xl">Envie sua mensagem</CardTitle>
              <CardDescription>
                Campos com <span aria-hidden="true" className="text-destructive">*</span> são
                obrigatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-name">
                    Nome <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-email">
                    E-mail <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="voce@exemplo.org"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-subject">
                  Assunto <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Select value={form.subject} onValueChange={(value) => update('subject', value)}>
                  <SelectTrigger id="contact-subject" aria-invalid={!!errors.subject}>
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.subject}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-message">
                  Mensagem <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(event) => update('message', event.target.value.slice(0, 2000))}
                  placeholder="Escreva sua mensagem..."
                  className="min-h-32"
                  aria-invalid={!!errors.message}
                />
                {errors.message ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.message}
                  </p>
                ) : null}
              </div>

              <Button size="lg" className="w-full font-semibold" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Enviar mensagem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
