/**
 * SOLO PARA DESARROLLO LOCAL. Crea un participante de prueba con los 7
 * módulos ya aprobados, para poder ver la insignia/certificado (y el botón
 * de LinkedIn) sin jugar los 52 escenarios primero.
 *
 * No usar contra la base de producción.
 *
 *   pnpm exec node prisma/seed-insignia-prueba.mts
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient as IdentidadClient } from '../generated/identidad/client.js';
import { PrismaClient as EntrenamientoClient } from '../generated/entrenamiento/client.js';
import { encrypt, hashEmail } from '../apps/identidad/src/pii/pii.ts';

function secret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el entorno (ver .env.example).`);
  return value;
}

const EMAIL = 'prueba.insignia@safeweb.test';
const PASSWORD = 'Prueba1234!';

const identidad = new IdentidadClient({
  adapter: new PrismaPg({ connectionString: process.env.IDENTIDAD_DATABASE_URL }, { schema: 'identidad' }),
});

const entrenamiento = new EntrenamientoClient({
  adapter: new PrismaPg(
    { connectionString: process.env.ENTRENAMIENTO_DATABASE_URL },
    { schema: 'entrenamiento' },
  ),
});

// Mismos ids que frontend/src/data/catalogo.ts (id = `${seccionId}/${escenarioId}`).
const ESCENARIOS_POR_MODULO: Record<string, string[]> = {
  phishing: [
    'phishing/loteria-premiada',
    'phishing/factura-sri',
    'phishing/clave-caducada',
    'phishing/rol-de-pagos',
    'phishing/quishing-actualice',
    'phishing/secuestro-hilo',
    'phishing/aviso-filtracion',
    'phishing/sesion-bogota',
  ],
  smishing: [
    'smishing/baja-suscripcion',
    'smishing/bono-estado',
    'smishing/entrega-programada',
    'smishing/tarjeta-bloqueada',
    'smishing/citacion-transito',
    'smishing/alerta-consumo',
    'smishing/paquete-retenido',
    'smishing/codigo-reenviado',
  ],
  vishing: [
    'vishing/premio-sorteo',
    'vishing/llamada-perdida',
    'vishing/entrega-courier',
    'vishing/devolucion-sri',
    'vishing/soporte-tecnico',
    'vishing/antifraude-banco',
    'vishing/banco-confirma',
    'vishing/encuesta-datos',
  ],
  suplantacion: [
    'suplantacion/cambio-numero',
    'suplantacion/perfil-clonado',
    'suplantacion/clonaron-tu-perfil',
    'suplantacion/jefe-urgente',
    'suplantacion/numero-nuevo-familia',
    'suplantacion/codigo-prestado',
    'suplantacion/cuenta-hackeada',
    'suplantacion/voz-clonada',
  ],
  estafa: [
    'estafa/saldo-contable',
    'estafa/mitad-de-precio',
    'estafa/visita-departamento',
    'estafa/arriendo-anticipado',
    'estafa/pago-lavadora',
    'estafa/vuelto-de-mas',
    'estafa/ganancia-garantizada',
    'estafa/tareas-pagadas',
  ],
  fisico: [
    'fisico/salida-segura',
    'fisico/trampa-usb',
    'fisico/cable-comprometido',
    'fisico/tarjeta-clonada',
    'fisico/descarga-programas-piratas',
    'fisico/puertos-frios-datacenter',
    'fisico/privacidad-claves',
    'fisico/qr-cafe-wifi',
  ],
  'asistentes-ia': [
    'asistentes-ia/correo-datos-terceros',
    'asistentes-ia/correo-credenciales',
    'asistentes-ia/resumen-documento-interno',
    'asistentes-ia/historial-cliente',
  ],
};

async function main() {
  const emailPepper = secret('EMAIL_PEPPER');
  const piiKey = secret('PII_ENCRYPTION_KEY');
  const emailHash = hashEmail(EMAIL, emailPepper);

  const existing = await identidad.participant.findFirst({ where: { emailHash } });
  if (existing) {
    // Limpia corridas previas para dejar el módulo en un estado predecible
    // si el script ya se corrió antes.
    await entrenamiento.scenarioRun.deleteMany({ where: { participantId: existing.id } });
    await entrenamiento.moduleReset.deleteMany({ where: { participantId: existing.id } });
  }

  const passwordHash = await hash(PASSWORD, 12);
  const participant = existing
    ? await identidad.participant.update({ where: { id: existing.id }, data: { passwordHash } })
    : await identidad.participant.create({
        data: {
          email: encrypt(EMAIL, piiKey),
          emailHash,
          nombre: encrypt('Prueba', piiKey),
          apellido: encrypt('Insignia', piiKey),
          passwordHash,
          role: 'PARTICIPANT',
        },
      });

  const now = new Date();
  const runs = Object.values(ESCENARIOS_POR_MODULO)
    .flat()
    .map((scenarioId) => ({
      id: randomUUID(),
      participantId: participant.id,
      participantSeq: participant.seq,
      scenarioId,
      outcome: 'CORRECTO' as const,
      score: 100,
      endingId: 'final-correcto',
      durationMs: 30_000,
      decisions: [],
      startedAt: now,
      finishedAt: now,
    }));

  await entrenamiento.scenarioRun.createMany({ data: runs });

  console.log(`
=== Cuenta de prueba para ver la insignia (SOLO local) ===

  Correo:     ${EMAIL}
  Contraseña: ${PASSWORD}

Los 7 módulos quedaron marcados como aprobados (${runs.length} corridas).
Entra con esta cuenta y abre "Ver insignia" en el certificado.
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
