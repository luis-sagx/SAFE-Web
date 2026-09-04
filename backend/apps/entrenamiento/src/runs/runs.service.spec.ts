import { ConflictException, NotFoundException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@comun';
import { RunsService } from './runs.service';
import { TOTALES, UMBRALES } from './progreso';
import type { PrismaService } from '../prisma/prisma.service';

/// Firma-simulada: guarda el último payload firmado para que los tests lo
/// inspeccionen, sin depender de un secreto real.
function jwtFake() {
  let ultimoPayload: unknown;
  const jwt = {
    signAsync: (payload: unknown) => {
      ultimoPayload = payload;
      return Promise.resolve('token-simulado');
    },
  } as unknown as JwtService;
  return { jwt, ultimoPayload: () => ultimoPayload };
}

interface CorridaFake {
  scenarioId: string;
  [k: string]: unknown;
}

/// Filtra por `scenarioId.startsWith`, igual que hace la consulta real de
/// `progreso()`: sin esto, dos módulos distintos en la misma lista de corridas
/// se contarían entre sí y el test no distinguiría "aprobado" de "no
/// aprobado" por módulo.
function serviceWith(runs: CorridaFake[], jwt?: JwtService) {
  const prisma = {
    scenarioRun: {
      findMany: ({
        where,
      }: { where?: { scenarioId?: { startsWith?: string } } } = {}) => {
        const prefijo = where?.scenarioId?.startsWith;
        const filtradas = prefijo
          ? runs.filter((r) => r.scenarioId.startsWith(prefijo))
          : runs;
        return Promise.resolve(filtradas);
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

/// Los `TOTALES[modulo]` (8) escenarios intentados, los primeros
/// `UMBRALES[modulo]` (6) en CORRECTO y el resto en lo que sea: lo mínimo que
/// `calcularProgreso` cuenta como aprobado desde que también exige haber
/// jugado los 8, no solo llegar al umbral (progreso.ts).
function corridasAprobadas(modulo: string) {
  return Array.from({ length: TOTALES[modulo] }, (_, i) => ({
    scenarioId: `${modulo}/e${i}`,
    outcome:
      i < UMBRALES[modulo] ? ('CORRECTO' as const) : ('INCORRECTO' as const),
    finishedAt: new Date(`2026-08-01T10:00:${String(i).padStart(2, '0')}.000Z`),
  }));
}

const PARTICIPANTE: JwtPayload = {
  sub: 'uuid-participante',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

describe('RunsService.progreso', () => {
  it('404 si el módulo no está en UMBRALES ni en TOTALES', async () => {
    await expect(
      serviceWith([]).progreso('p1', 'no-existe'),
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

    const progreso = await serviceWith(runs).progreso('p1', 'phishing');

    expect(progreso).toMatchObject({
      modulo: 'phishing',
      aprobados: 1,
      requeridos: 6,
    });
  });
});

describe('RunsService.atestacion', () => {
  it('firma la atestación cuando todos los módulos de UMBRALES están aprobados', async () => {
    const modulos = Object.keys(UMBRALES);
    const runs = modulos.flatMap((m) => corridasAprobadas(m));
    const { jwt, ultimoPayload } = jwtFake();

    const resultado = await serviceWith(runs, jwt).atestacion(PARTICIPANTE);

    expect(resultado).toEqual({ atestacion: 'token-simulado' });
    expect(ultimoPayload()).toEqual({
      sub: PARTICIPANTE.sub,
      seq: PARTICIPANTE.seq,
      modulos,
      typ: 'atestacion',
    });
  });

  // El endpoint no exige un número fijo de módulos: exige TODOS los que
  // declara UMBRALES. Si mañana se añade uno más, este test lo exigiría
  // igual sin cambiar una línea (spec 2026-09-03 §5.1).
  it('rechaza con 409 y nombra los módulos que faltan', async () => {
    const modulos = Object.keys(UMBRALES);
    const [primero, ...resto] = modulos;
    // Al primer módulo le falta una corrida: 5 de 6.
    const runsPrimero = corridasAprobadas(primero).slice(
      0,
      UMBRALES[primero] - 1,
    );
    const runs = [
      ...runsPrimero,
      ...resto.flatMap((m) => corridasAprobadas(m)),
    ];

    let error: unknown;
    try {
      await serviceWith(runs).atestacion(PARTICIPANTE);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      message: 'Todavía no apruebas todos los módulos.',
      faltan: [primero],
    });
  });
});
