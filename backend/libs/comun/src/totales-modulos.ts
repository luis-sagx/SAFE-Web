// Total de escenarios por módulo (mismo significado que TOTALS en
// apps/entrenamiento/src/runs/progreso.ts, que exige haber JUGADO los N
// escenarios, no solo alcanzar el umbral de aprobados). Vive en libs/comun
// porque identidad también lo necesita: para imprimir el denominador real de
// "aprobados/total" en el certificado, en vez de un número fijo que se
// desactualiza en cuanto el catálogo cambia (el PDF mostraba literalmente
// "/48", que dejó de ser cierto en cuanto un participante terminó
// asistentes-ia además de los otros 6 — el total real de los 7 es 52).
export const TOTALES_MODULOS: Record<string, number> = {
  phishing: 8,
  smishing: 8,
  vishing: 8,
  suplantacion: 8,
  estafa: 8,
  fisico: 8,
  'asistentes-ia': 4,
};
