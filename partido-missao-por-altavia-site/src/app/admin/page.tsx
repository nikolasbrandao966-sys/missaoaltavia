import type { Metadata } from 'next'
import { AdminGate } from '@/components/admin/admin-gate'

export const metadata: Metadata = {
  title: 'Administração — Partido Missão por Altávia (PMA)',
  description: 'Painel do administrador do Partido Missão por Altávia.',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminGate />
}
