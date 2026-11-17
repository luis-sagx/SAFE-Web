import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const PII_KEY = 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8=';

describe('AuthService con el esquema normalizado', () => {
  it('crea la cuenta, el perfil cifrado y el registro de estudio en una transacción', async () => {
    let createdAccount: Record<string, unknown> | undefined;
    let createdStudy: unknown;
    let lockSql = '';
    const queryRaw = jest.fn((strings: TemplateStringsArray) => {
      lockSql = strings.join('');
      return Promise.resolve([]);
    });
    const tx = {
      $queryRaw: queryRaw,
      account: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          createdAccount = data;
          const relations = data as {
            studyParticipant: { create: unknown };
          };
          createdStudy = relations.studyParticipant.create;
          return Promise.resolve({ id: 'account-1' });
        }),
      },
    };
    const prisma = {
      account: tx.account,
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    } as unknown as PrismaService;
    const config = {
      getOrThrow: (key: string) =>
        ({
          CEDULA_PEPPER: 'cedula-pepper',
          EMAIL_PEPPER: 'email-pepper',
          PII_ENCRYPTION_KEY: PII_KEY,
        })[key],
      get: (_key: string, fallback: string) => fallback,
    } as unknown as ConfigService;
    const mail = {
      sendEmailConfirmation: jest.fn().mockResolvedValue(true),
    } as never;
    const jwt = {} as JwtService;
    const service = new AuthService(prisma, jwt, config, mail);

    await service.register({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@correo.com',
      cedula: '1710034065',
      password: 'ClaveSegura123!',
    });

    const accountData = createdAccount as {
      role: { connect: { code: string } };
      profile: { create: Record<string, unknown> };
      studyParticipant: { create: Record<string, never> };
    };
    expect(accountData.role.connect.code).toBe('PARTICIPANT');
    for (const key of ['nombre', 'apellido', 'email']) {
      const value = accountData.profile.create[key];
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^v1:/);
    }
    expect(typeof accountData.profile.create.emailHash).toBe('string');
    expect(typeof accountData.profile.create.cedulaHash).toBe('string');
    expect(accountData.studyParticipant.create).toEqual({});
    expect(createdStudy).toEqual({});
    expect(tx.account.create).toHaveBeenCalledTimes(1);
    expect(lockSql).toContain('::text');
  });
});
