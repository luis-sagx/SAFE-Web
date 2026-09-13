import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { configureApp, type JwtPayload } from '@comun';
import { AppModule } from '../apps/entrenamiento/src/app.module';
import { PrismaService } from '../apps/entrenamiento/src/prisma/prisma.service';

export interface TestEnvironment {
  app: INestApplication;
  prisma: PrismaService;
  /// Firma un token como lo haría `identidad`. Que estas pruebas puedan
  /// hacerlo sin levantar el otro servicio ES la propiedad que se verifica:
  /// `entrenamiento` valida el JWT localmente y nunca llama a `identidad`.
  token: (payload: Partial<JwtPayload>) => Promise<string>;
}

export async function createTestApp(): Promise<TestEnvironment> {
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

  const app = configureApp(moduleRef.createNestApplication());
  await app.init();

  const jwt = app.get(JwtService);

  return {
    app,
    prisma: app.get(PrismaService),
    token: (payload) =>
      jwt.signAsync({
        sub: 'p-1',
        seq: 1,
        role: 'PARTICIPANT',
        typ: 'access',
        ...payload,
      } satisfies JwtPayload),
  };
}

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.scenarioRun.deleteMany();
}

export interface RunBody {
  id: string;
  scenarioId: string;
  outcome: string;
  score: number;
}

export interface ErrorBody {
  message: string | string[];
}

export interface ProgressBody {
  modulo: string;
  escenarios: { id: string; ultimoOutcome: string }[];
  aprobados: number;
  requeridos: number;
  aprobado: boolean;
  ronda: number;
  rondaEnCurso: {
    jugados: number;
    escenarios: { id: string; ultimoOutcome: string }[];
  } | null;
}

export function responseBody<T>(res: { body: unknown }): T {
  return res.body as T;
}

export function run(overrides: Record<string, unknown> = {}) {
  return {
    scenarioId: 'phishing/factura-sri',
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
