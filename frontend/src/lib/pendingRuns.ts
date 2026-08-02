// Cola de reintento: cada corrida es un dato del estudio y no se puede perder
// porque el servidor no respondiera al terminar un escenario.
import { ApiError, createRun, type RunPayload } from './api'

const KEY = 'mic-pending-runs'

function read(): RunPayload[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RunPayload[]) : []
  } catch {
    localStorage.removeItem(KEY)
    return []
  }
}

function write(runs: RunPayload[]): void {
  localStorage.setItem(KEY, JSON.stringify(runs))
}

export function queueRun(run: RunPayload): void {
  write([...read(), run])
}

export async function flushPendingRuns(): Promise<void> {
  const pending = read()

  if (pending.length === 0) {
    return
  }

  const failed: RunPayload[] = []

  for (const run of pending) {
    try {
      await createRun(run)
    } catch (error) {
      // Un 4xx que no sea 401 significa payload inválido: reintentarlo
      // fallaría siempre, así que se descarta.
      const invalid =
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 401

      if (!invalid) {
        failed.push(run)
      }
    }
  }

  write(failed)
}

export function pendingCount(): number {
  return read().length
}
