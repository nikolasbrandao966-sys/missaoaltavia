'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

const ADMIN_PASS_KEY = 'pma-admin-pass'

export function AdminGate() {
  const [password, setPassword] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Restaura a sessão guardada (aba atual) validando a senha contra a API
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_PASS_KEY)
    if (!stored) {
      setChecking(false)
      return
    }
    fetch('/api/admin/overview', { headers: { 'x-admin-password': stored } })
      .then((response) => {
        if (response.ok) {
          setPassword(stored)
        } else {
          sessionStorage.removeItem(ADMIN_PASS_KEY)
        }
      })
      .catch(() => sessionStorage.removeItem(ADMIN_PASS_KEY))
      .finally(() => setChecking(false))
  }, [])

  function handleUnauthorized() {
    sessionStorage.removeItem(ADMIN_PASS_KEY)
    setPassword(null)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Verificando sessão do administrador...</p>
      </div>
    )
  }

  if (!password) {
    return (
      <AdminLogin
        onSuccess={(value) => {
          sessionStorage.setItem(ADMIN_PASS_KEY, value)
          setPassword(value)
        }}
      />
    )
  }

  return <AdminDashboard password={password} onUnauthorized={handleUnauthorized} />
}
