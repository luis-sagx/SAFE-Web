import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { configurarApp } from '@comun';
import { AppModule } from '../apps/identidad/src/app.module';
import { MailService } from '../apps/identidad/src/mail/mail.service';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';

// Credenciales sintéticas exclusivas de e2e; no son secretos de ningún entorno.
// Mayúscula, número y símbolo: la misma política que exige RegisterDto.
export const PASSWORD_PRUEBA = ['Clave', 'Larga', '123!'].join('-');
export const PASSWORD_INVALIDA = ['Otra', 'Clave', '123!'].join('-');

/// Levanta el servicio de identidad contra la base de pruebas, sin el límite
/// por IP: todas las peticiones salen de la misma y el tope de 5/min haría
/// fallar suites enteras. El límite se verifica en throttling.e2e-spec.ts.
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
    // Sin esto, cada certificado emitido en un e2e intentaría mandar un
    // correo real por Resend: red de por medio en CI, y necesitaría
    // RESEND_API_KEY solo para que el servicio arrancara.
    .overrideProvider(MailService)
    .useValue({ enviarCertificado: () => Promise.resolve(true) })
    .compile();

  const app = configurarApp(moduleRef.createNestApplication());
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

/// Cada suite arranca de cero: comparten la misma base.
export async function limpiar(prisma: PrismaService): Promise<void> {
  await prisma.participant.deleteMany();
}

/// `res.body` es `any`: tipar las respuestas mueve el fallo al compilador.
export interface PerfilBody {
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

export interface SesionBody {
  accessToken: string;
  participant: PerfilBody;
}

// El refresh token no viaja en el body: llega en una cookie httpOnly (mic-refresh-token)
// que Set-Cookie pone en register/login/refresh. Se extrae para reenviarla a mano en las
// pruebas, justo lo que un navegador haría solo.
export function cookieRefresh(res: {
  headers: Record<string, unknown>;
}): string {
  const crudas = res.headers['set-cookie'];
  const lista = Array.isArray(crudas) ? crudas : [crudas].filter(Boolean);
  const cookie = (lista as string[]).find((c) =>
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

export function cuerpo<T>(res: { body: unknown }): T {
  return res.body as T;
}

let contadorCedulas = 0;

// Cédula válida según el módulo 10, generada (no de una lista fija, que se agotaría al
// crecer la suite y chocaría entre pruebas). Prefijo "170": provincia 17 (Pichincha),
// tercer dígito 0 (persona natural).
export function cedulaDePrueba(): string {
  contadorCedulas += 1;
  const base = `170${String(contadorCedulas).padStart(6, '0')}`;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const suma = coeficientes.reduce((total, coeficiente, i) => {
    const producto = Number(base[i]) * coeficiente;
    return total + (producto >= 10 ? producto - 9 : producto);
  }, 0);

  return base + String((10 - (suma % 10)) % 10);
}

export function registro(sufijo: string) {
  return {
    nombre: 'María',
    apellido: 'Pérez',
    // .ec y no .com: EsDominioPermitido (dominios-correo.ts) rechaza
    // dominios inventados fuera del ccTLD ecuatoriano o la allowlist de
    // proveedores libres.
    email: `maria.${sufijo}@ejemplo.ec`,
    cedula: cedulaDePrueba(),
    password: PASSWORD_PRUEBA,
  };
}
