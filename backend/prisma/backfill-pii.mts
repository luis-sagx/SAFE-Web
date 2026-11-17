/**
 * Cifra en el sitio las cuentas creadas antes del cifrado (issue #95): toda
 * fila con `emailHash` nulo. Cada campo puede contener texto legado o ciphertext:
 * el ciphertext se autentica y conserva sin cifrarlo de nuevo. Mientras no corre, esas
 * cuentas siguen totalmente funcionales (`auth.service.ts` cae a buscar por
 * el correo en claro, y `decrypt()` devuelve el texto plano tal cual al no
 * encontrar el prefijo "v1:"). Correrlo una vez es lo que termina de sacar
 * el texto plano de la base.
 *
 *   node prisma/backfill-pii.mts
 *   docker compose exec identidad node prisma/backfill-pii.mts   # en el servidor
 *
 * Seguro de correr más de una vez: la segunda vez no encuentra ninguna fila
 * con `emailHash` nulo y no hace nada.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
// Extensión .js: Node lo ejecuta como ESM y la resolución la exige (es un
// archivo generado, no fuente TypeScript, a diferencia de pii.ts, más abajo).
import { PrismaClient } from '../generated/identidad/client.js';
import { migratePiiProfile } from '../apps/identidad/src/pii/pii.ts';

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
  adapter: new PrismaPg(
    { connectionString: process.env.IDENTIDAD_DATABASE_URL },
    { schema: 'identidad' },
  ),
});

async function main() {
  const rows = await prisma.participant.findMany({
    where: { emailHash: null },
    select: { id: true, nombre: true, apellido: true, email: true },
  });

  if (rows.length === 0) {
    console.log(
      'No hay cuentas por migrar: todas tienen ya su huella de correo.',
    );
    return;
  }

  console.log(`${rows.length} cuenta(s) por cifrar…`);

  for (const row of rows) {
    await prisma.participant.update({
      where: { id: row.id },
      data: migratePiiProfile(row, piiKey, emailPepper),
    });
  }

  console.log(`${rows.length} cuenta(s) cifrada(s).`);
}

main()
  .catch(() => {
    console.error('No se pudo completar la migración de datos personales.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
