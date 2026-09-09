/**
 * Cifra en el sitio las cuentas creadas antes del cifrado (issue #95): toda
 * fila con `emailHash` nulo, porque esa es exactamente la marca de "no pasó
 * todavía por `register()` ni por el `seed.mts` ya actualizado" — los dos
 * únicos lugares que escriben una fila nueva, y los dos ponen `emailHash` a
 * la vez que cifran. No hay urgencia en correrlo: mientras no corre, esas
 * cuentas siguen totalmente funcionales (`auth.service.ts` cae a buscar por
 * el correo en claro, y `descifrar()` devuelve el texto plano tal cual al no
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
// archivo generado, no fuente TypeScript — a diferencia de pii.ts, más abajo).
import { PrismaClient } from '../generated/identidad/client.js';
import { cifrar, huellaEmail } from '../apps/identidad/src/pii/pii.ts';

function secreto(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta ${nombre} en el entorno (ver .env.example).`);
  }
  return valor;
}

const emailPepper = secreto('EMAIL_PEPPER');
const piiKey = secreto('PII_ENCRYPTION_KEY');

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.IDENTIDAD_DATABASE_URL },
    { schema: 'identidad' },
  ),
});

async function main() {
  const filas = await prisma.participant.findMany({
    where: { emailHash: null },
    select: { id: true, nombre: true, apellido: true, email: true },
  });

  if (filas.length === 0) {
    console.log(
      'No hay cuentas por migrar: todas tienen ya su huella de correo.',
    );
    return;
  }

  console.log(`${filas.length} cuenta(s) por cifrar…`);

  for (const fila of filas) {
    // Sin `emailHash` significa sin cifrar todavía (register() y seed.mts
    // ponen los dos a la vez): estos tres campos son texto plano seguro.
    await prisma.participant.update({
      where: { id: fila.id },
      data: {
        nombre: cifrar(fila.nombre, piiKey),
        apellido: cifrar(fila.apellido, piiKey),
        email: cifrar(fila.email, piiKey),
        emailHash: huellaEmail(fila.email, emailPepper),
      },
    });
  }

  console.log(`${filas.length} cuenta(s) cifrada(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
