import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { configureApp } from '@comun';
import { AppModule } from '../apps/identidad/src/app.module';
import { MailService } from '../apps/identidad/src/mail/mail.service';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';

// Credenciales sintéticas exclusivas de e2e; no son secretos de ningún entorno.
// Mayúscula, número y símbolo: la misma política que exige RegisterDto.
export const PASSWORD_TEST = ['Clave', 'Larga', '123!'].join('-');
export const PASSWORD_INVALID = ['Otra', 'Clave', '123!'].join('-');

/// Levanta el servicio de identidad contra la base de pruebas, sin el límite
/// por IP: todas las peticiones salen de la misma y el tope de 5/min haría
/// fallar suites enteras. El límite se verifica en throttling.e2e-spec.ts.
export async function createTestApp(): Promise<{
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
    // Sin esto, cada certificado emitido en un e2e intentaría mandar un
    // correo real por Resend: red de por medio en CI, y necesitaría
    // RESEND_API_KEY solo para que el servicio arrancara.
    .overrideProvider(MailService)
    .useValue({ enviarCertificado: () => Promise.resolve(true) })
    .compile();

  const app = configureApp(moduleRef.createNestApplication());
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

/// Cada suite arranca de cero: comparten la misma base.
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.participant.deleteMany();
}

/// `res.body` es `any`: tipar las respuestas mueve el fallo al compilador.
export interface ProfileBody {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: string;
  onboardingVisto: boolean;
  passwordHash?: never;
  seq?: never;
  cedulaHash?: never;
  onboardingVistoAt?: never;
}

export interface SessionBody {
  accessToken: string;
  participant: ProfileBody;
}

// El refresh token no viaja en el body: llega en una cookie httpOnly (mic-refresh-token)
// que Set-Cookie pone en register/login/refresh. Se extrae para reenviarla a mano en las
// pruebas, justo lo que un navegador haría solo.
export function getRefreshCookie(res: {
  headers: Record<string, unknown>;
}): string {
  const rawCookies = res.headers['set-cookie'];
  const list = Array.isArray(rawCookies)
    ? rawCookies
    : [rawCookies].filter(Boolean);
  const cookie = (list as string[]).find((c) =>
    c.startsWith('mic-refresh-token='),
  );

  if (!cookie) {
    throw new Error('La respuesta no puso la cookie mic-refresh-token.');
  }

  return cookie.split(';')[0];
}

export interface ErrorBody {
  message: string | string[];
}

export function responseBody<T>(res: { body: unknown }): T {
  return res.body as T;
}

let ecuadorianIdCounter = 0;

// Cédula válida según el módulo 10, generada (no de una lista fija, que se agotaría al
// crecer la suite y chocaría entre pruebas). Prefijo "170": provincia 17 (Pichincha),
// tercer dígito 0 (persona natural).
export function ecuadorianIdOfTest(): string {
  ecuadorianIdCounter += 1;
  const base = `170${String(ecuadorianIdCounter).padStart(6, '0')}`;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const sum = coefficients.reduce((total, coefficient, i) => {
    const product = Number(base[i]) * coefficient;
    return total + (product >= 10 ? product - 9 : product);
  }, 0);

  return base + String((10 - (sum % 10)) % 10);
}

export function registrationData(suffix: string) {
  return {
    nombre: 'María',
    apellido: 'Pérez',
    // .ec y no .com: EsDominioPermitido (dominios-correo.ts) rechaza
    // dominios inventados fuera del ccTLD ecuatoriano o la allowlist de
    // proveedores libres.
    email: `maria.${suffix}@ejemplo.ec`,
    cedula: ecuadorianIdOfTest(),
    password: PASSWORD_TEST,
  };
}
