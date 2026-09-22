/**
 * SOLO PARA DESARROLLO LOCAL. Borra la corrida de UN escenario puntual de la
 * cuenta de prueba (prueba.insignia@safeweb.test), para poder rejugarlo y
 * ver el cierre del entrenamiento disparar en vivo, sin tocar los demás
 * módulos ya aprobados.
 *
 *   node prisma/reset-un-escenario.mts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as IdentidadClient } from '../generated/identidad/client.js';
import { PrismaClient as EntrenamientoClient } from '../generated/entrenamiento/client.js';
import { hashEmail } from '../apps/identidad/src/pii/pii.ts';

const EMAIL = 'prueba.insignia@safeweb.test';
const SCENARIO_ID = 'asistentes-ia/historial-cliente';

function secret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el entorno (ver .env.example).`);
  return value;
}

const identidad = new IdentidadClient({
  adapter: new PrismaPg({ connectionString: process.env.IDENTIDAD_DATABASE_URL }, { schema: 'identidad' }),
});
const entrenamiento = new EntrenamientoClient({
  adapter: new PrismaPg(
    { connectionString: process.env.ENTRENAMIENTO_DATABASE_URL },
    { schema: 'entrenamiento' },
  ),
});

async function main() {
  const emailHash = hashEmail(EMAIL, secret('EMAIL_PEPPER'));
  const participant = await identidad.participant.findFirst({ where: { emailHash } });
  if (!participant) throw new Error(`No existe ${EMAIL}; corre primero prisma/seed-insignia-prueba.mts`);

  const { count } = await entrenamiento.scenarioRun.deleteMany({
    where: { participantId: participant.id, scenarioId: SCENARIO_ID },
  });

  console.log(`
Se borraron ${count} corrida(s) de "${SCENARIO_ID}" para ${EMAIL}.
Los otros 51 escenarios (incluidos los otros 3 de asistentes-ia) siguen
aprobados. Entra con esa cuenta, ve a "Asistentes de IA" y termina el
escenario "Historial de un cliente" para ver el cierre del entrenamiento.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await identidad.$disconnect();
    await entrenamiento.$disconnect();
  });
