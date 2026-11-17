import {
  decrypt,
  hashEmail,
  migratePiiField,
  migratePiiProfile,
} from '../apps/identidad/src/pii/pii.ts';

export type LegacyRole = 'PARTICIPANT' | 'ADMIN' | 'TRAINER';

export interface LegacyParticipantRow {
  id: string;
  seq: number;
  nombre: string;
  apellido: string;
  email: string;
  emailHash: string | null;
  cedulaHash: string | null;
  passwordHash: string;
  role: LegacyRole;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  emailConfirmedAt: Date | null;
  emailConfirmationTokenHash: string | null;
  emailConfirmationExpiresAt: Date | null;
  tokenVersion: number;
  onboardingVistoAt: Date | null;
  disabledAt: Date | null;
  createdAt: Date;
}

export interface LegacyCertificateRow {
  id: string;
  participantId: string;
  codigo: string;
  modulos: string[];
  horas: number;
  calificacion: number;
  emitidoAt: Date;
  revocadoAt: Date | null;
  certificadoEnviadoAt: Date | null;
}

const ROLE_IDS: Record<LegacyRole, string> = {
  PARTICIPANT: '00000000-0000-4000-8000-000000000001',
  ADMIN: '00000000-0000-4000-8000-000000000002',
  TRAINER: '00000000-0000-4000-8000-000000000003',
};

export function transformLegacyParticipant(
  row: LegacyParticipantRow,
  piiKey: string,
  emailPepper: string,
) {
  const profile =
    row.emailHash === null
      ? migratePiiProfile(
          { nombre: row.nombre, apellido: row.apellido, email: row.email },
          piiKey,
          emailPepper,
        )
      : {
          nombre: migratePiiField(row.nombre, piiKey),
          apellido: migratePiiField(row.apellido, piiKey),
          email: migratePiiField(row.email, piiKey),
          emailHash: row.emailHash,
        };

  const normalizedEmail = decrypt(profile.email, piiKey).trim().toLowerCase();
  const normalizedEmailHash = hashEmail(normalizedEmail, emailPepper);
  return {
    account: {
      id: row.id,
      roleId: ROLE_IDS[row.role],
      passwordHash: row.passwordHash,
      passwordResetTokenHash: row.passwordResetTokenHash,
      passwordResetExpiresAt: row.passwordResetExpiresAt,
      emailConfirmedAt: row.emailConfirmedAt,
      emailConfirmationTokenHash: row.emailConfirmationTokenHash,
      emailConfirmationExpiresAt: row.emailConfirmationExpiresAt,
      tokenVersion: row.tokenVersion,
      onboardingVistoAt: row.onboardingVistoAt,
      disabledAt: row.disabledAt,
      createdAt: row.createdAt,
    },
    profile: {
      accountId: row.id,
      nombre: profile.nombre,
      apellido: profile.apellido,
      email: profile.email,
      emailHash: normalizedEmailHash,
      cedulaHash: row.cedulaHash,
    },
    normalizedEmailHash,
    studyParticipant:
      row.role === 'PARTICIPANT' ? { accountId: row.id, seq: row.seq } : null,
  };
}

export function transformLegacyCertificate(row: LegacyCertificateRow) {
  const seen = new Set<string>();
  const modules = row.modulos.map((module, position) => {
    if (!module || seen.has(module)) {
      throw new Error('El certificado contiene módulos vacíos o duplicados.');
    }
    seen.add(module);
    return { certificateId: row.id, module, position };
  });

  return { id: row.id, participantId: row.participantId, modules };
}
