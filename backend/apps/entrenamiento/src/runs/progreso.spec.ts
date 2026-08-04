import { calcularProgreso, type CorridaMinima } from './progreso';

function corrida(
  overrides: Partial<CorridaMinima> & Pick<CorridaMinima, 'scenarioId'>,
) {
  return {
    outcome: 'CORRECTO' as const,
    finishedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('calcularProgreso', () => {
  it('cuenta aprobado solo lo que terminó en CORRECTO', () => {
    const progreso = calcularProgreso('phishing', 6, [
      corrida({ scenarioId: 'phishing/a', outcome: 'CORRECTO' }),
      corrida({ scenarioId: 'phishing/b', outcome: 'PARCIAL' }),
      corrida({ scenarioId: 'phishing/c', outcome: 'INCORRECTO' }),
    ]);

    expect(progreso.aprobados).toBe(1);
    expect(progreso.requeridos).toBe(6);
    expect(progreso.aprobado).toBe(false);
  });

  // La regla central del gating: no importa el orden en que la base devuelva
  // las filas, ni cuántas veces se repita un escenario — solo cuenta la
  // corrida con el finishedAt más tardío de cada uno.
  it('usa la última corrida de cada escenario sin importar el orden de llegada', () => {
    const progreso = calcularProgreso('phishing', 1, [
      corrida({
        scenarioId: 'phishing/a',
        outcome: 'CORRECTO',
        finishedAt: new Date('2026-08-03T00:00:00.000Z'),
      }),
      corrida({
        scenarioId: 'phishing/a',
        outcome: 'INCORRECTO',
        finishedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
      corrida({
        scenarioId: 'phishing/a',
        outcome: 'PARCIAL',
        finishedAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    ]);

    expect(progreso.escenarios).toEqual([
      { id: 'phishing/a', ultimoOutcome: 'CORRECTO' },
    ]);
  });

  // El caso que motiva "el último intento manda": alguien ya aprobado repite
  // el escenario y falla. Debe perder el punto, no conservarlo.
  it('un escenario ya aprobado que se repite y falla baja el conteo', () => {
    const progreso = calcularProgreso('phishing', 1, [
      corrida({
        scenarioId: 'phishing/a',
        outcome: 'CORRECTO',
        finishedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
      corrida({
        scenarioId: 'phishing/a',
        outcome: 'INCORRECTO',
        finishedAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    ]);

    expect(progreso.escenarios).toEqual([
      { id: 'phishing/a', ultimoOutcome: 'INCORRECTO' },
    ]);
    expect(progreso.aprobados).toBe(0);
    expect(progreso.aprobado).toBe(false);
  });

  it('aprobado pasa a true al alcanzar el umbral, ni un escenario antes', () => {
    const seis = Array.from({ length: 6 }, (_, i) =>
      corrida({ scenarioId: `phishing/${i}`, outcome: 'CORRECTO' }),
    );

    expect(calcularProgreso('phishing', 6, seis.slice(0, 5)).aprobado).toBe(
      false,
    );
    expect(calcularProgreso('phishing', 6, seis).aprobado).toBe(true);
  });

  it('sin corridas, progreso vacío y no aprobado', () => {
    const progreso = calcularProgreso('phishing', 6, []);

    expect(progreso.escenarios).toEqual([]);
    expect(progreso.aprobados).toBe(0);
    expect(progreso.aprobado).toBe(false);
  });
});
