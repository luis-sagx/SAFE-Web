import { getScenario, getSection } from '../data/catalogo'
import type { RunResult } from './api'

/// Una fila por corrida (formato "largo"): es lo que esperan R, SPSS o pandas
/// para el análisis estadístico. Solo sale el seudónimo, nunca identidad.
const HEADER = [
  'seudonimo',
  'modulo',
  'escenario_id',
  'escenario',
  'naturaleza',
  'dificultad',
  'version',
  'resultado',
  'puntaje',
  'final',
  'duracion_s',
  'inicio',
  'fin',
]

/// Excel ejecuta como fórmula la celda que empieza por = + - @ (o tab/CR):
/// se neutraliza con un apóstrofo (OWASP "CSV Injection").
function cell(value: string | number): string {
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function resultsToCsv(rows: RunResult[]): string {
  const lines = rows.map((r) => {
    const scenario = getScenario(r.scenarioId)
    const [sectionId = ''] = r.scenarioId.split('/')
    return [
      r.seudonimo,
      getSection(sectionId)?.titulo ?? sectionId,
      r.scenarioId,
      scenario?.titulo ?? '',
      scenario?.naturaleza ?? '',
      scenario?.dificultad ?? '',
      r.version,
      r.outcome,
      r.score,
      r.endingId,
      Math.round(r.durationMs / 1000),
      r.startedAt,
      r.finishedAt,
    ]
      .map(cell)
      .join(',')
  })
  // BOM: sin él Excel abre el UTF-8 como Latin-1 y rompe las tildes.
  return '﻿' + [HEADER.join(','), ...lines].join('\r\n') + '\r\n'
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
