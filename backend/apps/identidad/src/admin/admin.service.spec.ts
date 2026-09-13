import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { AdminService } from './admin.service';
import type { PrismaService } from '../prisma/prisma.service';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    seq: 7,
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@ejemplo.com',
    disabledAt: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

/// Mock mínimo: cada test pasa las funciones de Prisma que necesita. El
/// `ConfigService` es un valor fijo cualquiera: los fixtures de este archivo
/// son texto plano sin el prefijo "v1:", así que `decryptOptional()` los
/// deja pasar tal cual sin necesitar la clave real.
function service(prisma: Partial<Record<string, unknown>>) {
  return new AdminService(
    { participant: prisma } as unknown as PrismaService,
    { getOrThrow: () => 'clave-de-prueba' } as unknown as ConfigService,
  );
}

describe('AdminService.listar', () => {
  it('solo pide participantes y marca activo desde disabledAt', async () => {
    let whereReceived: unknown;
    const admin = service({
      findMany: (args: { where: unknown }) => {
        whereReceived = args.where;
        return Promise.resolve([
          row(),
          row({ id: 'p2', disabledAt: new Date() }),
        ]);
      },
    });

    const list = await admin.list();

    expect(whereReceived).toEqual({ role: 'PARTICIPANT' });
    expect(list[0]).toMatchObject({ id: 'p1', activo: true });
    // El seudónimo es la llave de pareo con el pre/post-test, y tiene que ser
    // el mismo código que emite `entrenamiento` para esa misma `seq`.
    expect(list[0].seudonimo).toBe('P007');
    expect(list[1]).toMatchObject({ id: 'p2', activo: false });
    // Nunca sale cédula ni hash.
    expect(JSON.stringify(list)).not.toContain('passwordHash');
    expect(JSON.stringify(list)).not.toContain('cedula');
  });
});

describe('AdminService.cambiarEstado', () => {
  it('desactiva fijando disabledAt', async () => {
    let receivedData: { disabledAt: Date | null } | undefined;
    const admin = service({
      findFirst: () => Promise.resolve(row()),
      update: (args: { data: { disabledAt: Date | null } }) => {
        receivedData = args.data;
        return Promise.resolve(row({ disabledAt: args.data.disabledAt }));
      },
    });

    const res = await admin.changeStatus('p1', false);

    expect(receivedData?.disabledAt).toBeInstanceOf(Date);
    expect(res.activo).toBe(false);
  });

  it('404 si el id no es de un participante', async () => {
    const admin = service({ findFirst: () => Promise.resolve(null) });
    await expect(admin.changeStatus('sup', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reactiva limpiando disabledAt', async () => {
    let receivedData: { disabledAt: Date | null } | undefined;
    const admin = service({
      findFirst: () => Promise.resolve(row({ disabledAt: new Date() })),
      update: (args: { data: { disabledAt: Date | null } }) => {
        receivedData = args.data;
        return Promise.resolve(row({ disabledAt: args.data.disabledAt }));
      },
    });

    const res = await admin.changeStatus('p1', true);

    expect(receivedData?.disabledAt).toBeNull();
    expect(res.activo).toBe(true);
  });
});

describe('AdminService.resetPassword', () => {
  it('devuelve una contraseña nueva y guarda su hash, no el claro', async () => {
    let storedHash: string | undefined;
    const admin = service({
      findFirst: () => Promise.resolve(row()),
      update: (args: { data: { passwordHash: string } }) => {
        storedHash = args.data.passwordHash;
        return Promise.resolve(row());
      },
    });

    const { password } = await admin.resetPassword('p1');

    expect(password).toHaveLength(12);
    expect(storedHash).toBeDefined();
    expect(storedHash).not.toContain(password);
    expect(await compare(password, storedHash as string)).toBe(true);
  });
});

describe('AdminService.eliminar', () => {
  it('borra a un participante', async () => {
    let deleted: unknown;
    const admin = service({
      findFirst: () => Promise.resolve({ id: 'p1' }),
      delete: (args: { where: unknown }) => {
        deleted = args.where;
        return Promise.resolve(row());
      },
    });

    await admin.delete('p1');
    expect(deleted).toEqual({ id: 'p1' });
  });

  it('404 si el id no es de un participante (p.ej. un supervisor)', async () => {
    const admin = service({ findFirst: () => Promise.resolve(null) });
    await expect(admin.delete('sup')).rejects.toBeInstanceOf(NotFoundException);
  });
});
