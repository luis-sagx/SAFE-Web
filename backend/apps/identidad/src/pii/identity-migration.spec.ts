import { encrypt, hashEmail } from './pii';
import {
  transformLegacyCertificate,
  transformLegacyParticipant,
} from '../../../../prisma/identity-migration-transform';

const PII_KEY = 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8=';

describe('transformaciones de migración de identidad', () => {
  it('conserva IDs, hashes y secuencia, cifra perfil mixto y mapea rol', () => {
    const encryptedLastName = encrypt('Pérez', PII_KEY);
    const encryptedEmail = encrypt(' ANA@CORREO.COM ', PII_KEY);
    const result = transformLegacyParticipant(
      {
        id: 'account-id',
        seq: 42,
        nombre: 'Ana',
        apellido: encryptedLastName,
        email: encryptedEmail,
        emailHash: null,
        cedulaHash: 'cedula-hmac',
        passwordHash: 'bcrypt-hash',
        role: 'PARTICIPANT',
        passwordResetTokenHash: 'reset-hash',
        passwordResetExpiresAt: null,
        emailConfirmedAt: new Date('2026-01-01T00:00:00Z'),
        emailConfirmationTokenHash: null,
        emailConfirmationExpiresAt: null,
        tokenVersion: 3,
        onboardingVistoAt: null,
        disabledAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
      PII_KEY,
      'email-pepper',
    );

    expect(result.account).toMatchObject({
      id: 'account-id',
      passwordHash: 'bcrypt-hash',
      passwordResetTokenHash: 'reset-hash',
      tokenVersion: 3,
    });
    expect(typeof result.account.roleId).toBe('string');
    expect(result.account.roleId).not.toBe('');
    expect(result.profile.nombre).toMatch(/^v1:/);
    expect(result.profile.apellido).toBe(encryptedLastName);
    expect(result.profile.email).toBe(encryptedEmail);
    expect(result.profile.emailHash).toBeTruthy();
    expect(result.profile.cedulaHash).toBe('cedula-hmac');
    expect(result.studyParticipant).toEqual({
      accountId: 'account-id',
      seq: 42,
    });
  });

  it('no asigna secuencia de estudio a personal administrativo', () => {
    const result = transformLegacyParticipant(
      {
        id: 'admin-id',
        seq: 9,
        nombre: 'Admin',
        apellido: 'Uno',
        email: encrypt('admin@safeweb.test', PII_KEY),
        emailHash: hashEmail('admin@safeweb.test', 'email-pepper'),
        cedulaHash: null,
        passwordHash: 'bcrypt-hash',
        role: 'ADMIN',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        emailConfirmedAt: new Date(),
        emailConfirmationTokenHash: null,
        emailConfirmationExpiresAt: null,
        tokenVersion: 0,
        onboardingVistoAt: null,
        disabledAt: null,
        createdAt: new Date(),
      },
      PII_KEY,
      'email-pepper',
    );

    expect(result.studyParticipant).toBeNull();
    expect(result.account.roleId).not.toBe(result.account.id);
  });

  it('expande módulos del certificado preservando el orden', () => {
    expect(
      transformLegacyCertificate({
        id: 'cert-id',
        participantId: 'account-id',
        codigo: 'SW-ABCD-EFGH',
        modulos: ['phishing', 'smishing'],
        horas: 4,
        calificacion: 42,
        emitidoAt: new Date(),
        revocadoAt: null,
        certificadoEnviadoAt: null,
      }).modules.map((module) => module.position),
    ).toEqual([0, 1]);
  });

  it('preserva participantId de certificados aunque la cuenta ya no exista', () => {
    const certificate = transformLegacyCertificate({
      id: 'cert-orphan',
      participantId: 'deleted-account-id',
      codigo: 'SW-ABCD-EFGH',
      modulos: ['phishing'],
      horas: 4,
      calificacion: 42,
      emitidoAt: new Date(),
      revocadoAt: null,
      certificadoEnviadoAt: null,
    });

    expect(certificate).toMatchObject({
      id: 'cert-orphan',
      participantId: 'deleted-account-id',
      modules: [
        { certificateId: 'cert-orphan', module: 'phishing', position: 0 },
      ],
    });
  });

  it('rechaza módulos duplicados en un certificado', () => {
    expect(() =>
      transformLegacyCertificate({
        id: 'cert-id',
        participantId: 'account-id',
        codigo: 'SW-ABCD-EFGH',
        modulos: ['phishing', 'phishing'],
        horas: 4,
        calificacion: 42,
        emitidoAt: new Date(),
        revocadoAt: null,
        certificadoEnviadoAt: null,
      }),
    ).toThrow();
  });

  it('recalcula la huella desde el correo descifrado sin alterar su ciphertext', () => {
    const ciphertext = encrypt(' ANA@CORREO.COM ', PII_KEY);
    const result = transformLegacyParticipant(
      {
        id: 'account-id',
        seq: 1,
        nombre: encrypt('Ana', PII_KEY),
        apellido: encrypt('Uno', PII_KEY),
        email: ciphertext,
        emailHash: 'hash-obsoleto',
        cedulaHash: null,
        passwordHash: 'bcrypt-hash',
        role: 'PARTICIPANT',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        emailConfirmedAt: new Date(),
        emailConfirmationTokenHash: null,
        emailConfirmationExpiresAt: null,
        tokenVersion: 0,
        onboardingVistoAt: null,
        disabledAt: null,
        createdAt: new Date(),
      },
      PII_KEY,
      'email-pepper',
    );

    expect(result.profile.email).toBe(ciphertext);
    expect(result.profile.emailHash).toBe(
      hashEmail('ana@correo.com', 'email-pepper'),
    );
  });

  it('rechaza ciphertext malformado antes de copiarlo', () => {
    expect(() =>
      transformLegacyParticipant(
        {
          id: 'account-id',
          seq: 1,
          nombre: 'v1:malformado',
          apellido: 'Uno',
          email: encrypt('ana@correo.com', PII_KEY),
          emailHash: hashEmail('ana@correo.com', 'email-pepper'),
          cedulaHash: null,
          passwordHash: 'bcrypt-hash',
          role: 'PARTICIPANT',
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          emailConfirmedAt: null,
          emailConfirmationTokenHash: null,
          emailConfirmationExpiresAt: null,
          tokenVersion: 0,
          onboardingVistoAt: null,
          disabledAt: null,
          createdAt: new Date(),
        },
        PII_KEY,
        'email-pepper',
      ),
    ).toThrow();
  });

  it('conserva dos cuentas aunque su correo normalizado produzca la misma huella', () => {
    const makeRow = (id: string, email: string) =>
      transformLegacyParticipant(
        {
          id,
          seq: 1,
          nombre: encrypt('Ana', PII_KEY),
          apellido: encrypt('Uno', PII_KEY),
          email: encrypt(email, PII_KEY),
          emailHash: null,
          cedulaHash: null,
          passwordHash: `password-${id}`,
          role: 'PARTICIPANT',
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          emailConfirmedAt: new Date(),
          emailConfirmationTokenHash: null,
          emailConfirmationExpiresAt: null,
          tokenVersion: 0,
          onboardingVistoAt: null,
          disabledAt: null,
          createdAt: new Date(),
        },
        PII_KEY,
        'email-pepper',
      );
    const first = makeRow('first', 'ana@correo.com');
    const second = makeRow('second', ' ANA@CORREO.COM ');

    expect(first.account.id).toBe('first');
    expect(second.account.id).toBe('second');
    expect(first.normalizedEmailHash).toBe(second.normalizedEmailHash);
  });
});
