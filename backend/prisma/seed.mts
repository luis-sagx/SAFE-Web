/**
 * Crea la cuenta de supervisor: la única que gestiona participantes y ve los
 * resultados del estudio dentro de la app. Los participantes se registran solos
 * desde la plataforma.
 *
 *   pnpm seed -- --email tu.correo@espe.edu.ec
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
// Extensión .js: Node lo ejecuta como ESM y la resolución la exige.
import { PrismaClient } from '../generated/identidad/client.js';
import { encrypt, hashEmail } from '../apps/identidad/src/pii/pii.ts';

function secret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en el entorno (ver .env.example).`);
  }
  return value;
}

const emailPepper = secret('EMAIL_PEPPER');
const piiKey = secret('PII_ENCRYPTION_KEY');

const prisma = new PrismaClient({
  // El schema va como segundo argumento, no como `?schema=` en la URL: el
  // driver adapter no honra ese parámetro y se queda en `public`, donde el rol
  // no tiene permiso. Mismo motivo que en `apps/identidad/src/prisma`.
  adapter: new PrismaPg(
    { connectionString: process.env.IDENTIDAD_DATABASE_URL },
    { schema: 'identidad' },
  ),
});

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
}

/// ~60 bits de entropía y legible: se puede dictar en voz alta.
function makePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(
    randomBytes(12),
    (byte) => alphabet[byte % alphabet.length],
  ).join('');
}

async function main() {
  const email = arg('email', 'supervisor@espe.edu.ec').toLowerCase();
  const reset = process.argv.includes('--reset');
  const emailHash = hashEmail(email, emailPepper);

  // `OR` con `email` por si la cuenta se creó antes del cifrado (issue #95)
  // y `backfill-pii.mts` todavía no la alcanzó: esas filas no tienen huella
  // todavía, solo el correo en claro.
  const existing = await prisma.participant.findFirst({
    where: { OR: [{ emailHash }, { email }] },
  });

  // Solo se imprime una contraseña que quedó guardada de verdad.
  if (existing && !reset) {
    console.log(`
La cuenta de supervisor ${email} ya existe; su contraseña no se tocó.
Para generar una nueva:  pnpm seed -- --email ${email} --reset
`);
    return;
  }

  const password = makePassword();
  const passwordHash = await hash(password, 12);

  if (existing) {
    await prisma.participant.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
  } else {
    await prisma.participant.create({
      data: {
        email: encrypt(email, piiKey),
        emailHash,
        nombre: encrypt('Supervisor', piiKey),
        apellido: encrypt('del estudio', piiKey),
        // Sin cédula: no es participante, gestiona el estudio.
        passwordHash,
        role: 'SUPERVISOR',
      },
    });
  }

  console.log(`
=== Cuenta de supervisor (guardar fuera del repositorio) ===

  Correo:     ${email}
  Contraseña: ${password}

Con ella se gestionan las cuentas de participante y se ven los resultados del
estudio (seudonimizados) dentro de la app.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
