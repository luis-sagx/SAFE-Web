/**
 * Borra los datos personales dejando intactas las corridas: convierte la
 * pseudonimización en anonimización real (NIST SP 800-188).
 *
 *   pnpm anonimizar -- --confirmar
 *
 * ES IRREVERSIBLE y deja a los participantes sin poder iniciar sesión.
 *
 * Solo toca el servicio de IDENTIDAD. Las corridas viven en otro schema, bajo
 * otro rol de Postgres, y este script no tiene forma de alcanzarlas — que es
 * exactamente lo que se quiere: la anonimización no puede tocar el dato del
 * estudio ni por accidente.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/identidad/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.IDENTIDAD_DATABASE_URL }),
});

async function main() {
  const confirmado = process.argv.includes('--confirmar');

  const pendientes = await prisma.participant.count({
    where: { anonymizedAt: null, role: 'PARTICIPANT' },
  });

  if (!confirmado) {
    console.log(`
Se anonimizarían ${pendientes} participantes. Las corridas no se tocan: viven
en el servicio de entrenamiento y ya están identificadas solo por seudónimo.

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
        apellido: null,
        // La huella de la cédula se borra igual que el resto. Aunque el pepper
        // ya no exista, un valor que no está no se puede atacar.
        cedulaHash: null,
        // El correo es único, así que no puede quedar en null: se reemplaza
        // por un valor sin información. El hash se invalida.
        email: `anonimo-${seq}@invalido.local`,
        passwordHash: 'ANONIMIZADO',
        anonymizedAt: new Date(),
      },
    });
  }

  console.log(`
Listo. ${participantes.length} participantes anonimizados. Las corridas
quedaron intactas.

FALTA UN PASO, Y ES MANUAL: borra CEDULA_PEPPER del .env del servidor y de
cualquier respaldo. Mientras ese secreto exista, una huella de cédula que se
hubiera copiado antes seguiría siendo reproducible. Sin él, no.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
