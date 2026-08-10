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
    participantCohort: 'comerciantes',
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

describe('RunsService.exportCsv', () => {
  it('emite la cabecera y una fila por corrida', async () => {
    const csv = await serviceWith([runFixture()]).exportCsv();
    const [header, row] = csv.split('\n');

    expect(header).toBe(
      'seudonimo,cohort,scenarioId,version,outcome,score,endingId,durationMs,startedAt,finishedAt',
    );
    expect(row).toBe(
      'P007,comerciantes,phishing/factura-sri,1,CORRECTO,100,e_verifica,42000,2026-08-01T10:00:00.000Z,2026-08-01T10:00:42.000Z',
    );
  });

  // La garantía de privacidad del estudio. Antes dependía de que el `select`
  // de esta consulta estuviera bien escrito; ahora este servicio no tiene la
  // tabla de participantes en su schema ni permiso sobre el schema que la
  // tiene. Aun así se prueba: si alguien reintrodujera un campo personal en
  // ScenarioRun, esto lo atraparía.
  it('nunca exporta datos personales aunque vengan en la fila', async () => {
    const csv = await serviceWith([
      runFixture({
        nombre: 'María Pérez',
        email: 'maria@gmail.com',
        telefono: '0991234567',
      }),
    ]).exportCsv();

    expect(csv).not.toContain('María');
    expect(csv).not.toContain('maria@gmail.com');
    expect(csv).not.toContain('0991234567');
    expect(csv).toContain('P007');
  });

  // Si una comilla o una coma no se escapan, las columnas se corren y el
  // análisis estadístico lee valores de la columna equivocada.
  it('escapa comas y comillas para no correr las columnas', async () => {
    const csv = await serviceWith([
      runFixture({
        participantSeq: 8,
        participantCohort: 'adultos, mayores',
        endingId: 'dijo "no"',
      }),
    ]).exportCsv();

    const row = csv.split('\n')[1];

    expect(row).toContain('"adultos, mayores"');
    expect(row).toContain('"dijo ""no"""');
  });

  // endingId y cohort los controla el participante. Sin este escape, un valor
  // que empieza con `=`/`+`/`-`/`@` se ejecuta como fórmula cuando el
  // investigador abre el CSV en una hoja de cálculo (inyección de fórmulas).
  it('neutraliza valores que parecen fórmula anteponiendo una comilla', async () => {
    const csv = await serviceWith([
      runFixture({
        participantSeq: 10,
        participantCohort: '=HYPERLINK("http://x",1)',
        endingId: '+cmd',
      }),
    ]).exportCsv();

    const row = csv.split('\n')[1];

    // La comilla inicial evita la fórmula; las comillas internas y la coma
    // obligan a citar toda la celda, con las comillas duplicadas.
    expect(row).toContain('"\'=HYPERLINK(""http://x"",1)"');
    expect(row).toContain("'+cmd");
    expect(row).not.toMatch(/,=HYPERLINK/);
    expect(row).not.toContain(',+cmd');
  });

  it('deja la cohorte vacía cuando el participante no tiene grupo', async () => {
    const csv = await serviceWith([
      runFixture({ participantSeq: 9, participantCohort: null }),
    ]).exportCsv();

    expect(csv.split('\n')[1].startsWith('P009,,')).toBe(true);
  });
});
