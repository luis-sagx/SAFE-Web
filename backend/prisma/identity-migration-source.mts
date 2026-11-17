import type {
  LegacyCertificateRow,
  LegacyParticipantRow,
} from './identity-migration-transform.ts';

export type LegacyIdentityQuery = <T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T>;

export async function readLegacyIdentity(query: LegacyIdentityQuery): Promise<{
  participants: LegacyParticipantRow[];
  certificates: LegacyCertificateRow[];
}> {
  const [participants, certificates] = await Promise.all([
    query<LegacyParticipantRow[]>`
      SELECT "id", "seq", "nombre", "apellido", "email",
             "emailHash", "cedulaHash", "passwordHash", "role"::TEXT AS "role",
             "passwordResetTokenHash", "passwordResetExpiresAt",
             "emailConfirmedAt", "emailConfirmationTokenHash",
             "emailConfirmationExpiresAt", "tokenVersion", "onboardingVistoAt",
             "disabledAt", "createdAt"
      FROM "identidad"."Participant"
      ORDER BY "id" ASC
    `,
    query<LegacyCertificateRow[]>`
      SELECT "id", "participantId", "codigo", "modulos", "horas",
             "calificacion", "emitidoAt", "revocadoAt", "certificadoEnviadoAt"
      FROM "identidad"."Certificate"
      ORDER BY "id" ASC
    `,
  ]);

  return { participants, certificates };
}
