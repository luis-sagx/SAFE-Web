// Cola de reintento: cada corrida es un dato del estudio y no se puede perder
// porque el servidor no respondiera al terminar un escenario.
import { ApiError, createRun, type RunPayload } from './api'

const KEY = 'mic-pending-runs'

export interface FlushPendingRunsResult {
  sent: number
  remaining: number
}

let flushInProgress: Promise<FlushPendingRunsResult> | null = null

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
    return { sent: 0, remaining: 0 }
  }

  const failed: RunPayload[] = []
  let sent = 0

  for (const run of pending) {
    try {
      await createRun(run)
      sent += 1
    } catch (error) {
      if (isRetryableRunError(error)) {
        failed.push(run)
      }
    }
  }

  // queueRun siempre agrega al final. Si terminó otra corrida mientras este
  // vaciado esperaba al servidor, se conserva esa cola nueva en vez de
  // sobrescribirla con la fotografía tomada al inicio.
  const queuedWhileFlushing = read().slice(pending.length)
  const remaining = [...failed, ...queuedWhileFlushing]
  write(remaining)
  return { sent, remaining: remaining.length }
}

export function flushPendingRuns(): Promise<FlushPendingRunsResult> {
  if (flushInProgress) {
    return flushInProgress
  }

  flushInProgress = flush().finally(() => {
    flushInProgress = null
  })

  return flushInProgress
}

export function pendingCount(): number {
  return read().length
}
