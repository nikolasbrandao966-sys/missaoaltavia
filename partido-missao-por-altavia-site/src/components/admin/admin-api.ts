// Auxiliares de acesso às rotas /api/admin/* pela área do administrador.

export class AdminUnauthorizedError extends Error {
  constructor() {
    super('Sessão do administrador expirada.')
  }
}

export type AdminSession = {
  password: string
  onUnauthorized: () => void
}

export type Overview = {
  dbConnected: boolean
  publishedNews: number
  draftNews: number
  candidacies: number
  members: number
  messages: number
  unreadMessages: number
}

// fetch com o cabeçalho de senha do administrador; 401 → sessão encerrada
export async function adminFetch(
  url: string,
  session: AdminSession,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      'x-admin-password': session.password,
      ...(init?.headers ?? {}),
    },
  })
  if (response.status === 401) {
    session.onUnauthorized()
    throw new AdminUnauthorizedError()
  }
  return response
}
