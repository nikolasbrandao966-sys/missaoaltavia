// Cliente REST do Firebase Realtime Database — PMA (uso apenas no servidor).
//
// As rotas de API usam este cliente quando não há DATABASE_URL: notícias,
// candidaturas, filiados, mensagens e estatísticas passam a ficar salvos na
// nuvem (projeto texnk-87824) e sobrevivem a redeploys e a visitas futuras.
// A REST API é a mesma interface usada pelo SDK web do Firebase — por isso
// nenhuma dependência nova é necessária e o build permanece igual.
//
// Comportamento de falha: rede fora, regras bloqueadas ou timeout -> as
// funções lançam RtdbUnavailableError e o chamador cai para o modo memória;
// após uma falha, as tentativas pausam por 60s (cooldown) para não segurar
// cada requisição do site com timeouts repetidos.

import { FIREBASE_RTDB_BASE } from '@/lib/firebase'

const REQUEST_TIMEOUT_MS = 8000
const COOLDOWN_MS = 60_000

export class RtdbUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RtdbUnavailableError'
  }
}

let cooldownUntil = 0

// O banco está em cooldown após uma falha recente?
export function rtdbCoolingDown(): boolean {
  return Date.now() < cooldownUntil
}

async function request<T>(
  method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T | null> {
  if (rtdbCoolingDown()) {
    throw new RtdbUnavailableError(
      'Realtime Database em cooldown após falha recente.'
    )
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${FIREBASE_RTDB_BASE}/${path}.json`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new RtdbUnavailableError(`HTTP ${response.status} em ${method} ${path}`)
    }
    cooldownUntil = 0
    return (await response.json()) as T
  } catch (error) {
    cooldownUntil = Date.now() + COOLDOWN_MS
    if (error instanceof RtdbUnavailableError) throw error
    throw new RtdbUnavailableError(
      `Falha ao acessar o Realtime Database (${method} ${path}): ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  } finally {
    clearTimeout(timer)
  }
}

// Lê o nó no caminho — null quando o nó não existe.
export async function rtdbGet<T = unknown>(path: string): Promise<T | null> {
  return request<T>('GET', path)
}

// Grava o valor completo no caminho (substitui o nó).
export async function rtdbPut(path: string, value: unknown): Promise<void> {
  await request('PUT', path, value)
}

// Mescla os campos informados no nó existente.
export async function rtdbPatch(path: string, value: unknown): Promise<void> {
  await request('PATCH', path, value)
}

// Remove o nó.
export async function rtdbDelete(path: string): Promise<void> {
  await request('DELETE', path)
}
