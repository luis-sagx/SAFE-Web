import { getScenario, getSection } from '../data/catalogo'
import type { AssessmentResult, RunResult } from './api'

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


/** Respuestas 1–4 según el orden del cuestionario; puntajes en aciertos (0–21). */
export function assessmentResultsToCsv(rows: AssessmentResult[]): string {
  const header = ['seudonimo', 'version', 'estado', 'pre_edad', 'pre_genero', 'post_edad', 'post_genero', 'pre_puntaje', 'post_puntaje', 'diferencia',
    ...Array.from({ length: 21 }, (_, index) => `pre_p${index + 1}`),
    ...Array.from({ length: 21 }, (_, index) => `post_p${index + 1}`)]
  const lines = rows.map((row) => {
    const state = row.baselineMissing
      ? (row.posttest ? 'sin_medicion_inicial' : 'sin_medicion_inicial_final_pendiente')
      : (row.pretest && row.posttest ? 'par_completo' : row.pretest ? 'final_pendiente' : 'inicial_pendiente')
    return [row.pseudonym, row.version, state, row.pretest?.ageRange ?? '', row.pretest?.gender ?? '', row.posttest?.ageRange ?? '', row.posttest?.gender ?? '', row.pretest?.score ?? '', row.posttest?.score ?? '', row.pretest && row.posttest ? row.improvement ?? '' : '',
      ...Array.from({ length: 21 }, (_, index) => row.pretest?.answers[index] === undefined ? '' : row.pretest.answers[index]! + 1),
      ...Array.from({ length: 21 }, (_, index) => row.posttest?.answers[index] === undefined ? '' : row.posttest.answers[index]! + 1)].map(cell).join(',')
  })
  return '﻿' + [header.join(','), ...lines].join('\r\n') + '\r\n'
}
