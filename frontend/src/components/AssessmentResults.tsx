import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fetchAssessmentResults, type AssessmentResult } from '../lib/api'
import { assessmentResultsToCsv, downloadCsv } from '../lib/resultsCsv'

export default function AssessmentResults() {
  const [rows, setRows] = useState<AssessmentResult[] | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetchAssessmentResults().then(
      (results) => { if (!cancelled) setRows(results) },
      () => { if (!cancelled) setError(true) },
    )
    return () => { cancelled = true }
  }, [retry])
  if (error) return <div><p role="alert" className="text-danger">No pudimos cargar las evaluaciones.</p><button className="min-h-11 text-link underline" onClick={() => { setError(false); setRetry((value) => value + 1) }}>Reintentar</button></div>
  if (!rows) return <p role="status" className="text-body">Cargando evaluaciones…</p>
  return <div className="space-y-4">
    <p className="text-base text-body">Evaluaciones por seudónimo. Los puntajes son aciertos de 0 a 21; la diferencia se calcula solo para pares completos. En el CSV, las respuestas de 1 a 4 siguen el orden del cuestionario. Las cuentas sin medición inicial quedan fuera de la comparación.</p>
    <button disabled={rows.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control bg-surface px-4 text-ink disabled:opacity-60" onClick={() => downloadCsv(`evaluaciones-${new Date().toISOString().slice(0, 10)}.csv`, assessmentResultsToCsv(rows))}><Download aria-hidden className="size-4" />Exportar evaluaciones CSV</button>
    {rows.length === 0 ? <p className="text-body">Todavía no hay evaluaciones registradas.</p> : <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-base text-body"><thead><tr className="border-b border-hairline"><th className="p-3">Seudónimo</th><th className="p-3">Inicial</th><th className="p-3">Final</th><th className="p-3">Diferencia</th></tr></thead><tbody>{rows.map((row) => <tr key={row.pseudonym} className="border-b border-hairline"><td className="p-3">{row.pseudonym}</td><td className="p-3">{row.pretest?.score ?? (row.baselineMissing ? 'Sin medición inicial' : 'Pendiente')}</td><td className="p-3">{row.posttest?.score ?? 'Pendiente'}</td><td className="p-3">{row.pretest && row.posttest ? row.improvement ?? '—' : 'No comparable'}</td></tr>)}</tbody></table></div>}
  </div>
}
