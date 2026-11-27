'use client'

import { useState } from 'react'
import { Loader2, Lock, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PartyLogo } from '@/components/party/logo'

export function AdminLogin({ onSuccess }: { onSuccess: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!password.trim()) {
      setError('Informe a senha do administrador.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error ?? 'Senha incorreta.')
        return
      }
      onSuccess(password.trim())
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
            <PartyLogo className="h-12 w-12" priority />
          </span>
          <CardTitle className="font-display text-xl">Painel do Administrador</CardTitle>
          <CardDescription>
            Acesso restrito à Direção Nacional do Partido Missão por Altávia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-login-password">Senha do administrador</Label>
            <Input
              id="admin-login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit()
              }}
              placeholder="••••••••••"
              autoComplete="current-password"
              autoFocus
            />
            {error ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="mt-5 w-full font-semibold">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Validando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Entrar no painel
              </>
            )}
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Área protegida por senha.
          </p>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground">
          <a href="/" className="transition-colors hover:text-foreground hover:underline">
            ← Voltar ao site público
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}
