import type { RunOutcomeValue } from './dto/create-run.dto';

/// Cuántos escenarios de un módulo hay que aprobar para que cuente como
/// superado. El denominador que se muestra en pantalla (8) NO vive aquí: lo
/// declara el catálogo del frontend, que es el único lugar donde los
/// escenarios existen de verdad (spec 2026-08-03-safe-web-mvp-phishing-design.md
/// §7.2). Este servicio nunca importa el catálogo — un cliente modificado no
/// puede aprobarse solo falseando un denominador que el servidor tampoco
/// tiene.
export const UMBRALES: Record<string, number> = {
  phishing: 6,
  smishing: 6,
  vishing: 6,
  suplantacion: 6,
  estafa: 6,
  fisico: 6,
  'asistentes-ia': 3,
};

/// Cuántos escenarios tiene el módulo en total. A diferencia de `UMBRALES`,
/// esto SÍ duplica un número que el catálogo del frontend también declara —
/// una excepción deliberada a la regla de arriba. Es la única forma de que
/// "aprobado" (y por tanto el certificado, spec 2026-09-03 §5.1) exija haber
/// jugado los 8, no solo alcanzar el umbral y dejar el resto sin tocar. El
/// riesgo de divergencia lo cubre `catalogo.test.ts` en el frontend, que ya
/// fija cada sección en 8 escenarios.
export const TOTALES: Record<string, number> = {
  phishing: 8,
  smishing: 8,
  vishing: 8,
  suplantacion: 8,
  estafa: 8,
  fisico: 8,
  'asistentes-ia': 4,
};

export interface CorridaMinima {
  scenarioId: string;
  outcome: RunOutcomeValue;
  finishedAt: Date;
}

export interface ProgresoEscenario {
  id: string;
  ultimoOutcome: RunOutcomeValue;
}

export interface Progreso {
  modulo: string;
  escenarios: ProgresoEscenario[];
  aprobados: number;
  requeridos: number;
  aprobado: boolean;
  ronda: number;
  rondaEnCurso: {
    jugados: number;
    escenarios: ProgresoEscenario[];
  } | null;
}

/**
 * El último intento manda siempre, aunque baje la nota: si un participante ya
 * aprobado repite un escenario y falla, pierde ese escenario y puede bajar del
 * umbral. Es deliberado — el estado refleja lo que la persona demuestra ahora,
 * no su mejor momento.
 *
 * PARCIAL no cuenta como aprobado: en un escenario de fraude significa que
 * dudó y entregó la clave igual. Solo CORRECTO acredita.
 *
 * Un escenario sin ninguna corrida no aparece en `escenarios`: el backend no
 * conoce el catálogo, así que no puede rellenar "sin intentar" para ids que
 * nunca ve.
 *
 * `aprobado` exige dos cosas, no una: alcanzar el umbral Y haber intentado
 * los `total` escenarios del módulo. Antes bastaba con el umbral, y eso
 * dejaba "aprobado" a alguien que llegó a 6/8 y nunca tocó los dos que
 * faltaban — el instrumento perdía justo los dos escenarios que más
 * interesaba medir. `escenarios.length` ya cuenta "cuántos se intentaron
 * alguna vez", así que no hace falta un segundo conteo.
 */
export function calcularProgreso(
  modulo: string,
  requeridos: number,
  total: number,
  corridas: CorridaMinima[],
): Progreso {
  // Ordenadas de más antigua a más reciente: lo último que se escribe en el
  // mapa para cada escenario es siempre su corrida más reciente, sin importar
  // en qué orden llegaron de la base ni cuántas veces se haya repetido.
  const ordenadas = [...corridas].sort(
    (a, b) => a.finishedAt.getTime() - b.finishedAt.getTime(),
  );
  const rondasCerradas: Map<string, RunOutcomeValue>[] = [];
  let rondaAbierta = new Map<string, RunOutcomeValue>();
  let idsRonda = new Set<string>();
  for (const corrida of ordenadas) {
    idsRonda.add(corrida.scenarioId);
    rondaAbierta.set(corrida.scenarioId, corrida.outcome);
    if (idsRonda.size >= total) {
      rondasCerradas.push(rondaAbierta);
      rondaAbierta = new Map<string, RunOutcomeValue>();
      idsRonda = new Set<string>();
    }
  }

  const rondaOficial = rondasCerradas.at(-1) ?? rondaAbierta;
  const escenarios: ProgresoEscenario[] = [...rondaOficial.entries()].map(
    ([id, ultimoOutcome]) => ({ id, ultimoOutcome }),
  );

  const aprobados = escenarios.filter(
    (e) => e.ultimoOutcome === 'CORRECTO',
  ).length;

  const escenariosAbiertos: ProgresoEscenario[] = [
    ...rondaAbierta.entries(),
  ].map(([id, ultimoOutcome]) => ({ id, ultimoOutcome }));
  return {
    modulo,
    escenarios,
    aprobados,
    requeridos,
    aprobado: aprobados >= requeridos && escenarios.length >= total,
    ronda: Math.max(1, rondasCerradas.length + (rondaAbierta.size > 0 ? 1 : 0)),
    rondaEnCurso:
      rondasCerradas.length > 0 && rondaAbierta.size > 0
        ? { jugados: rondaAbierta.size, escenarios: escenariosAbiertos }
        : null,
  };
}
