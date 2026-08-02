import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/// Levanta la app real contra la base de pruebas, sin el límite por IP: todas
/// las peticiones salen de la misma y el tope de 5/min haría fallar suites
/// enteras. El límite se verifica en throttling.e2e-spec.ts.
export async function crearApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  // Se reemplaza el almacén y no el guard: los guards globales llevan un token
  // interno que overrideGuard() no alcanza.
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ThrottlerStorage)
    .useValue({
      increment: () =>
        Promise.resolve({
          totalHits: 1,
          timeToExpire: 60,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
    })
    .compile();

  const app = configurarApp(moduleRef.createNestApplication());
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

/// Cada suite arranca de cero: comparten la misma base.
export async function limpiar(prisma: PrismaService): Promise<void> {
  await prisma.scenarioRun.deleteMany();
  await prisma.participant.deleteMany();
}

/// `res.body` es `any`: tipar las respuestas mueve el fallo al compilador.
export interface PerfilBody {
  id: string;
  nombre: string | null;
  email: string | null;
  role: string;
  cohort: string | null;
  passwordHash?: never;
  seq?: never;
}

export interface SesionBody {
  accessToken: string;
  participant: PerfilBody;
}

export interface CorridaBody {
  id: string;
  scenarioId: string;
  outcome: string;
  score: number;
}

export interface ErrorBody {
  message: string | string[];
}

export function cuerpo<T>(res: { body: unknown }): T {
  return res.body as T;
}

export function registro(sufijo: string) {
  return {
    nombre: 'María Pérez',
    email: `maria.${sufijo}@ejemplo.com`,
    telefono: '0991234567',
    password: 'clave-larga-123',
  };
}

export function corrida(overrides: Record<string, unknown> = {}) {
  return {
    scenarioId: 'suplantacion/cambio-numero',
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'e_verifica',
    durationMs: 42_000,
    startedAt: '2026-08-01T10:00:00.000Z',
    decisions: [{ desde: 'n1', hacia: 'n2' }],
    ...overrides,
  };
}
