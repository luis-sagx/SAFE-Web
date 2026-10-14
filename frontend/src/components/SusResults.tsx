import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fetchSusResults, type SusResult } from '../lib/api'
import { downloadCsv, susResultsToCsv } from '../lib/resultsCsv'

export default function SusResults() {
  const [rows, setRows] = useState<SusResult[] | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetchSusResults().then(
      (results) => { if (!cancelled) setRows(results) },
      () => { if (!cancelled) setError(true) },
    )
    return () => { cancelled = true }
  }, [retry])
  if (error) return <div><p role="alert" className="text-danger">No pudimos cargar las respuestas de la encuesta SUS.</p><button className="min-h-11 text-link underline" onClick={() => { setError(false); setRetry((value) => value + 1) }}>Reintentar</button></div>
  if (!rows) return <p role="status" className="text-body">Cargando respuestas SUS…</p>
  return <div className="space-y-4">
    <p className="text-base text-body">Respuestas de usabilidad por seudónimo. El puntaje SUS va de 0 a 100; las respuestas conservan la escala de 1 a 5.</p>
    <button disabled={rows.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control bg-surface px-4 text-ink disabled:opacity-60" onClick={() => downloadCsv(`encuesta-sus-${new Date().toISOString().slice(0, 10)}.csv`, susResultsToCsv(rows))}><Download aria-hidden className="size-4" />Exportar encuesta SUS CSV</button>
    {rows.length === 0 ? <p className="text-body">Todavía no hay respuestas de la encuesta SUS.</p> : <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-base text-body"><thead><tr className="border-b border-hairline"><th className="p-3">Seudónimo</th><th className="p-3">Versión</th><th className="p-3">Puntaje SUS</th>{Array.from({ length: 10 }, (_, index) => <th key={index} className="p-3">P{index + 1}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={`${row.pseudonym}-${row.version}`} className="border-b border-hairline"><td className="p-3">{row.pseudonym}</td><td className="p-3">{row.version}</td><td className="p-3">{row.score}</td>{row.answers.map((answer, index) => <td key={index} className="p-3">{answer}</td>)}</tr>)}</tbody></table></div>}
  </div>
}
