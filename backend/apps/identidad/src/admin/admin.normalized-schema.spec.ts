import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService con el esquema normalizado', () => {
  it('crea testers como cuentas con perfil cifrado y sin secuencia de estudio', async () => {
    let createdData: Record<string, unknown> | undefined;
    let lockSql = '';
    const queryRaw = jest.fn((strings: TemplateStringsArray) => {
      lockSql = strings.join('');
      return Promise.resolve([]);
    });
    const create = jest.fn(({ data }: { data: Record<string, unknown> }) => {
      createdData = data;
      return Promise.resolve({ id: 'trainer-1' });
    });
    const transaction = {
      $queryRaw: queryRaw,
      account: { findFirst: jest.fn().mockResolvedValue(null), create },
    };
    const prisma = {
      ...transaction,
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        Promise.resolve(callback(transaction)),
      ),
    } as unknown as PrismaService;
    const config = {
      getOrThrow: (key: string) =>
        key === 'PII_ENCRYPTION_KEY'
          ? 'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm8='
          : 'email-pepper',
    } as unknown as ConfigService;
    const service = new AdminService(prisma, config);

    await service.createTrainer({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ANA@CORREO.COM',
    });

    const accountData = createdData as {
      role: { connect: { code: string } };
      profile: { create: Record<string, unknown> };
    };
    expect(accountData.role.connect.code).toBe('TRAINER');
    for (const key of ['nombre', 'apellido', 'email']) {
      const value = accountData.profile.create[key];
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^v1:/);
    }
    expect(typeof accountData.profile.create.emailHash).toBe('string');
    expect(createdData).not.toHaveProperty('studyParticipant');
    expect(lockSql).toContain('::text');
  });
});
