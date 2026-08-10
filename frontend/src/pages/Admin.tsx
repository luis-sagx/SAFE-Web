import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Trash2 } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import {
  cambiarEstadoParticipante,
  eliminarParticipante,
  fetchParticipantes,
  fetchResultados,
  restablecerPasswordParticipante,
  type AdminParticipante,
  type ResultadoCorrida,
} from '../lib/api'

type Pestana = 'participantes' | 'resultados'

function nombreCompleto(p: AdminParticipante): string {
  const partes = [p.nombre, p.apellido].filter(Boolean)
  return partes.length > 0 ? partes.join(' ') : '—'
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/// Contraseña recién generada para un participante: se muestra una vez y el
/// supervisor la copia. El backend no la guarda en claro.
function BannerPassword({
  password,
  onClose,
}: {
  password: string
  onClose: () => void
}) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline-strong bg-canvas-soft px-4 py-3"
    >
      <p className="text-sm text-body">
        Contraseña nueva (cópiala ahora, no vuelve a mostrarse):{' '}
        <code className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-ink">
          {password}
        </code>
      </p>
      <button
        type="button"
        onClick={onClose}
        className="text-sm font-medium text-link underline"
      >
        Entendido
      </button>
    </div>
  )
}

function Participantes() {
  const [lista, setLista] = useState<AdminParticipante[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [passwordNueva, setPasswordNueva] = useState('')

  const cargar = useCallback(() => {
    setCargando(true)
    fetchParticipantes()
      .then(setLista)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(cargar, [cargar])

  async function conBloqueo(id: string, accion: () => Promise<void>) {
    setError('')
    setOcupado(id)
    try {
      await accion()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  const alternarEstado = (p: AdminParticipante) =>
    conBloqueo(p.id, async () => {
      const actualizado = await cambiarEstadoParticipante(p.id, !p.activo)
      setLista((prev) => prev.map((x) => (x.id === p.id ? actualizado : x)))
    })

  const restablecer = (p: AdminParticipante) =>
    conBloqueo(p.id, async () => {
      const { password } = await restablecerPasswordParticipante(p.id)
      setPasswordNueva(password)
    })

  const eliminar = (p: AdminParticipante) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${nombreCompleto(p)}? No se puede deshacer.`)) {
      return
    }
    return conBloqueo(p.id, async () => {
      await eliminarParticipante(p.id)
      setLista((prev) => prev.filter((x) => x.id !== p.id))
    })
  }

  if (cargando) {
    return <p className="text-base text-muted">Cargando participantes…</p>
  }

  return (
    <div>
      {passwordNueva && (
        <BannerPassword password={passwordNueva} onClose={() => setPasswordNueva('')} />
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {lista.length === 0 ? (
        <p className="text-base text-muted">Todavía no hay participantes registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline-strong">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft text-muted">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 text-ink">{nombreCompleto(p)}</td>
                  <td className="px-4 py-3 text-body">{p.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.activo
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-strong text-muted'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${p.activo ? 'bg-success' : 'bg-muted'}`}
                      />
                      {p.activo ? 'Activa' : 'Desactivada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">{fecha(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {ocupado === p.id && (
                        <Loader2 aria-hidden className="size-4 animate-spin text-muted" />
                      )}
                      <button
                        type="button"
                        disabled={ocupado === p.id}
                        onClick={() => alternarEstado(p)}
                        className="h-8 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
                      >
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        disabled={ocupado === p.id}
                        onClick={() => restablecer(p)}
                        title="Restablecer contraseña"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
                      >
                        <KeyRound aria-hidden className="size-3.5" strokeWidth={1.75} />
                        Clave
                      </button>
                      <button
                        type="button"
                        disabled={ocupado === p.id}
                        onClick={() => eliminar(p)}
                        title="Eliminar cuenta"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/30 bg-surface px-2.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
                      >
                        <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const OUTCOME_LABEL: Record<string, string> = {
  CORRECTO: 'Correcto',
  PARCIAL: 'Parcial',
  INCORRECTO: 'Incorrecto',
}

function Resultados() {
  const [filas, setFilas] = useState<ResultadoCorrida[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResultados()
      .then(setFilas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <p className="text-base text-muted">Cargando resultados…</p>
  }
  if (error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    )
  }
  if (filas.length === 0) {
    return <p className="text-base text-muted">Todavía no hay corridas registradas.</p>
  }

  return (
    <div>
      <p className="mb-4 text-sm text-body">
        {filas.length} corridas. Cada participante aparece solo por su seudónimo (P001…): ningún
        dato personal sale de aquí.
      </p>
      <div className="overflow-x-auto rounded-lg border border-hairline-strong">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-canvas-soft text-muted">
              <th className="px-4 py-3 font-semibold">Seudónimo</th>
              <th className="px-4 py-3 font-semibold">Escenario</th>
              <th className="px-4 py-3 font-semibold">Ver.</th>
              <th className="px-4 py-3 font-semibold">Resultado</th>
              <th className="px-4 py-3 font-semibold">Puntaje</th>
              <th className="px-4 py-3 font-semibold">Duración</th>
              <th className="px-4 py-3 font-semibold">Terminó</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r, i) => (
              <tr key={`${r.seudonimo}-${i}`} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 font-medium text-ink tabular-nums">{r.seudonimo}</td>
                <td className="px-4 py-3 text-body">{r.scenarioId}</td>
                <td className="px-4 py-3 text-muted tabular-nums">{r.version}</td>
                <td className="px-4 py-3 text-body">{OUTCOME_LABEL[r.outcome] ?? r.outcome}</td>
                <td className="px-4 py-3 text-ink tabular-nums">{r.score}</td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {Math.round(r.durationMs / 1000)}s
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">{fecha(r.finishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Admin() {
  const { displayName, logout } = useAuth()
  const [pestana, setPestana] = useState<Pestana>('participantes')

  const tabClase = (activa: boolean) =>
    `h-9 rounded-md px-3 text-sm font-medium transition ${
      activa
        ? 'bg-surface-strong text-ink'
        : 'text-body hover:bg-canvas-soft'
    }`

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">SAFE Web</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
            Supervisión
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-body sm:inline">{displayName || 'Supervisor'}</span>
          <button
            type="button"
            onClick={logout}
            className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong"
          >
            Salir
          </button>
        </div>
      </AppHeader>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          Panel del supervisor
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Gestión del estudio</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Administra las cuentas de participante y revisa los resultados seudonimizados. Nada se
          descarga: todo se ve aquí.
        </p>

        <div className="mt-8 flex gap-1 border-b border-hairline pb-3" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'participantes'}
            onClick={() => setPestana('participantes')}
            className={tabClase(pestana === 'participantes')}
          >
            Participantes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'resultados'}
            onClick={() => setPestana('resultados')}
            className={tabClase(pestana === 'resultados')}
          >
            Resultados
          </button>
        </div>

        <section className="mt-8">
          {pestana === 'participantes' ? <Participantes /> : <Resultados />}
        </section>
      </main>
    </div>
  )
}

export default Admin
