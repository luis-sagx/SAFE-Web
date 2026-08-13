import { RunsService } from './runs.service';
import type { PrismaService } from '../prisma/prisma.service';

function serviceWith(runs: unknown[]) {
  const prisma = {
    scenarioRun: { findMany: () => Promise.resolve(runs) },
  } as unknown as PrismaService;

  return new RunsService(prisma);
}

function runFixture(overrides: Record<string, unknown> = {}) {
  return {
    participantSeq: 7,
    scenarioId: 'phishing/factura-sri',
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 42_000,
    startedAt: new Date('2026-08-01T10:00:00.000Z'),
    finishedAt: new Date('2026-08-01T10:00:42.000Z'),
    ...overrides,
  };
}

describe('RunsService.resultados', () => {
  it('mapea cada corrida a su fila seudonimizada', async () => {
    const [fila] = await serviceWith([runFixture()]).resultados();

    expect(fila).toEqual({
      seudonimo: 'P007',
      scenarioId: 'phishing/factura-sri',
      version: 1,
      outcome: 'CORRECTO',
      score: 100,
      endingId: 'e_verifica',
      durationMs: 42_000,
      startedAt: '2026-08-01T10:00:00.000Z',
      finishedAt: '2026-08-01T10:00:42.000Z',
    });
  });

  // La garantía de privacidad del estudio. Este servicio no tiene la tabla de
  // participantes en su schema ni permiso sobre el schema que la tiene. Aun así
  // se prueba: si alguien reintrodujera un campo personal en ScenarioRun, esto
  // lo atraparía.
  it('nunca incluye datos personales aunque vengan en la fila', async () => {
    const [fila] = await serviceWith([
      runFixture({
        nombre: 'María Pérez',
        email: 'maria@gmail.com',
        telefono: '0991234567',
      }),
    ]).resultados();

    const texto = JSON.stringify(fila);
    expect(texto).not.toContain('María');
    expect(texto).not.toContain('maria@gmail.com');
    expect(texto).not.toContain('0991234567');
    expect(fila.seudonimo).toBe('P007');
  });
});
