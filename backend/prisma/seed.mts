/**
 * Crea la cuenta de investigador, la única que puede exportar resultados.
 * Los participantes se registran solos desde la plataforma.
 *
 *   pnpm seed -- --email tu.correo@espe.edu.ec
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
// Extensión .js: Node lo ejecuta como ESM y la resolución la exige.
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
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
  const email = arg('email', 'investigador@espe.edu.ec').toLowerCase();
  const reset = process.argv.includes('--reset');

  const existente = await prisma.participant.findUnique({ where: { email } });

  // Solo se imprime una contraseña que quedó guardada de verdad.
  if (existente && !reset) {
    console.log(`
La cuenta de investigador ${email} ya existe; su contraseña no se tocó.
Para generar una nueva:  pnpm seed -- --email ${email} --reset
`);
    return;
  }

  const password = makePassword();
  const passwordHash = await hash(password, 12);

  if (existente) {
    await prisma.participant.update({ where: { email }, data: { passwordHash } });
  } else {
    await prisma.participant.create({
      data: { email, nombre: 'Investigador', passwordHash, role: 'RESEARCHER' },
    });
  }

  console.log(`
=== Cuenta de investigador (guardar fuera del repositorio) ===

  Correo:     ${email}
  Contraseña: ${password}

Con ella se descarga la exportación en /api/runs/export.csv
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
