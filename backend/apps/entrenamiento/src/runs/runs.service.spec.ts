import { ConflictException, NotFoundException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@comun';
import { RunsService } from './runs.service';
import { TOTALS, THRESHOLDS } from './progreso';
import type { PrismaService } from '../prisma/prisma.service';

/// Firma-simulada: guarda el último payload firmado para que los tests lo
/// inspeccionen, sin depender de un secreto real.
function jwtFake() {
  let latestPayload: unknown;
  const jwt = {
    signAsync: (payload: unknown) => {
      latestPayload = payload;
      return Promise.resolve('token-simulado');
    },
  } as unknown as JwtService;
  return { jwt, latestPayload: () => latestPayload };
}

interface MockRun {
  scenarioId: string;
  [k: string]: unknown;
}

/// Filtra por `scenarioId.startsWith`, igual que hace la consulta real de
/// `progreso()`: sin esto, dos módulos distintos en la misma lista de corridas
/// se contarían entre sí y el test no distinguiría "aprobado" de "no
/// aprobado" por módulo.
function serviceWith(runs: MockRun[], jwt?: JwtService) {
  const prisma = {
    scenarioRun: {
      findMany: ({
        where,
      }: { where?: { scenarioId?: { startsWith?: string } } } = {}) => {
        const prefix = where?.scenarioId?.startsWith;
        const filtered = prefix
          ? runs.filter((r) => r.scenarioId.startsWith(prefix))
          : runs;
        return Promise.resolve(filtered);
      },
    },
  } as unknown as PrismaService;

  return new RunsService(prisma, jwt ?? jwtFake().jwt);
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
    const [row] = await serviceWith([runFixture()]).results();

    expect(row).toEqual({
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
    const [row] = await serviceWith([
      runFixture({
        nombre: 'María Pérez',
        email: 'maria@gmail.com',
        telefono: '0991234567',
      }),
    ]).results();

    const text = JSON.stringify(row);
    expect(text).not.toContain('María');
    expect(text).not.toContain('maria@gmail.com');
    expect(text).not.toContain('0991234567');
    expect(row.seudonimo).toBe('P007');
  });
});

/// Los `TOTALS[modulo]` (8) escenarios intentados, los primeros
/// `THRESHOLDS[modulo]` (6) en CORRECTO y el resto en lo que sea: lo mínimo que
/// `calculateProgress` cuenta como aprobado desde que también exige haber
/// jugado los 8, no solo llegar al umbral (progreso.ts).
function approvedRuns(module: string) {
  return Array.from({ length: TOTALS[module] }, (_, i) => ({
    scenarioId: `${module}/e${i}`,
    outcome:
      i < THRESHOLDS[module] ? ('CORRECTO' as const) : ('INCORRECTO' as const),
    finishedAt: new Date(`2026-08-01T10:00:${String(i).padStart(2, '0')}.000Z`),
  }));
}

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-participante',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

describe('RunsService.progreso', () => {
  it('404 si el módulo no está en THRESHOLDS ni en TOTALS', async () => {
    await expect(
      serviceWith([]).progress('p1', 'no-existe'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('calcula el progreso de un módulo real con las corridas del participante', async () => {
    const runs = [
      {
        scenarioId: 'phishing/factura-sri',
        outcome: 'CORRECTO' as const,
        finishedAt: new Date('2026-08-01T10:00:00.000Z'),
      },
    ];

    const progress = await serviceWith(runs).progress('p1', 'phishing');

    expect(progress).toMatchObject({
      modulo: 'phishing',
      aprobados: 1,
      requeridos: 6,
    });
  });
});

describe('RunsService.atestacion', () => {
  it('firma la atestación cuando todos los módulos de THRESHOLDS están aprobados', async () => {
    const modules = Object.keys(THRESHOLDS);
    const runs = modules.flatMap((m) => approvedRuns(m));
    const { jwt, latestPayload } = jwtFake();

    const result = await serviceWith(runs, jwt).attestation(PARTICIPANT);

    expect(result).toEqual({ atestacion: 'token-simulado' });
    expect(latestPayload()).toEqual({
      sub: PARTICIPANT.sub,
      seq: PARTICIPANT.seq,
      modulos: modules,
      // Suma de THRESHOLDS[modulo] para cada módulo: `approvedRuns` deja
      // exactamente ese número en CORRECTO por módulo. Calculado y no fijo,
      // para no romper cada vez que se añade o cambia un módulo.
      calificacion: modules.reduce((total, m) => total + THRESHOLDS[m], 0),
      typ: 'atestacion',
    });
  });

  it('incluye riesgo físico entre los módulos exigidos para el certificado', async () => {
    const modules = Object.keys(THRESHOLDS);
    const { jwt, latestPayload } = jwtFake();

    await serviceWith(
      modules.flatMap((m) => approvedRuns(m)),
      jwt,
    ).attestation(PARTICIPANT);

    expect((latestPayload() as { modulos: string[] }).modulos).toContain(
      'fisico',
    );
  });

  // El endpoint no exige un número fijo de módulos: exige TODOS los que
  // declara THRESHOLDS. Si mañana se añade uno más, este test lo exigiría
  // igual sin cambiar una línea (spec 2026-09-03 §5.1).
  it('rechaza con 409 y nombra los módulos que faltan', async () => {
    const modules = Object.keys(THRESHOLDS);
    const [first, ...rest] = modules;
    // Al primer módulo le falta una corrida: 5 de 6.
    const firstModuleRuns = approvedRuns(first).slice(0, THRESHOLDS[first] - 1);
    const runs = [...firstModuleRuns, ...rest.flatMap((m) => approvedRuns(m))];

    let error: unknown;
    try {
      await serviceWith(runs).attestation(PARTICIPANT);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      message: 'Todavía no apruebas todos los módulos.',
      faltan: [first],
    });
  });
});
