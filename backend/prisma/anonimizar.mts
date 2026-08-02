/**
 * Borra los datos personales dejando intactas las corridas: convierte la
 * pseudonimización en anonimización real (NIST SP 800-188).
 *
 *   pnpm anonimizar -- --confirmar
 *
 * ES IRREVERSIBLE y deja a los participantes sin poder iniciar sesión.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const confirmado = process.argv.includes('--confirmar');

  const pendientes = await prisma.participant.count({
    where: { anonymizedAt: null, role: 'PARTICIPANT' },
  });
  const corridas = await prisma.scenarioRun.count();

  if (!confirmado) {
    console.log(`
Se anonimizarían ${pendientes} participantes (${corridas} corridas se conservan).

Esto borra nombre, correo y teléfono de forma IRREVERSIBLE. Nadie podrá
volver a iniciar sesión. Hazlo solo cuando la recolección de datos haya
terminado y ya tengas el CSV exportado.

Para ejecutarlo de verdad:  pnpm anonimizar -- --confirmar
`);
    return;
  }

  const participantes = await prisma.participant.findMany({
    where: { anonymizedAt: null, role: 'PARTICIPANT' },
    select: { id: true, seq: true },
  });

  for (const { id, seq } of participantes) {
    await prisma.participant.update({
      where: { id },
      data: {
        nombre: null,
        telefono: null,
        // El correo es único, así que no puede quedar en null: se reemplaza
        // por un valor sin información. El hash se invalida.
        email: `anonimo-${seq}@invalido.local`,
        passwordHash: 'ANONIMIZADO',
        anonymizedAt: new Date(),
      },
    });
  }

  console.log(
    `\nListo. ${participantes.length} participantes anonimizados. ` +
      `${corridas} corridas conservadas.\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
