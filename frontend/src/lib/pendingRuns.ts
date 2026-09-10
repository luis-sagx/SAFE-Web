// Cola de reintento: cada corrida es un dato del estudio y no se puede perder
// porque el servidor no respondiera al terminar un escenario.
import { ApiError, createRun, type RunPayload } from './api'

const LEGACY_KEY = 'mic-pending-runs'
const ENTRY_PREFIX = 'mic-pending-run:'
const LOCK_NAME = 'mic-pending-runs-flush'

export interface FlushPendingRunsResult {
  sent: number
  rejected: number
  remaining: number
}

let flushInProgress: Promise<FlushPendingRunsResult> | null = null

interface StoredRun {
  key: string
  run: RunPayload
}

function migrateLegacyQueue(): void {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return

  try {
    const runs = JSON.parse(raw) as RunPayload[]
    if (!Array.isArray(runs)) throw new Error('Cola inválida')

    runs.forEach((run, index) => {
      localStorage.setItem(`${ENTRY_PREFIX}legacy-${index}`, JSON.stringify(run))
    })
  } catch {
    // Una cola ilegible no puede recuperarse. Se elimina para que no rompa
    // cada carga posterior de la aplicación.
  } finally {
    localStorage.removeItem(LEGACY_KEY)
  }
}

function read(): StoredRun[] {
  migrateLegacyQueue()

  const keys = Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter((key): key is string => Boolean(key?.startsWith(ENTRY_PREFIX)))

  return keys.flatMap((key) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? [{ key, run: JSON.parse(raw) as RunPayload }] : []
    } catch {
      localStorage.removeItem(key)
      return []
    }
  })
}

export function queueRun(run: RunPayload): void {
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(`${ENTRY_PREFIX}${id}`, JSON.stringify(run))
}

/** Los errores temporales conservan la corrida; un rechazo definitivo del
 * payload no debe crecer una cola que jamás podrá vaciarse. */
export function isRetryableRunError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return true
  }

  return (
    error.status === 401 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  )
}

async function flush(): Promise<FlushPendingRunsResult> {
  const pending = read()

  if (pending.length === 0) {
    return { sent: 0, rejected: 0, remaining: 0 }
  }

  let sent = 0
  let rejected = 0

  for (const entry of pending) {
    try {
      await createRun(entry.run)
      localStorage.removeItem(entry.key)
      sent += 1
    } catch (error) {
      if (!isRetryableRunError(error)) {
        localStorage.removeItem(entry.key)
        rejected += 1
      }
    }
  }

  return { sent, rejected, remaining: read().length }
}

export function flushPendingRuns(): Promise<FlushPendingRunsResult> {
  if (flushInProgress) {
    return flushInProgress
  }

  const locks = navigator.locks
  const currentFlush = locks ? locks.request(LOCK_NAME, flush) : flush()

  flushInProgress = currentFlush.finally(() => {
    flushInProgress = null
  })

  return flushInProgress
}

export function pendingCount(): number {
  return read().length
}
