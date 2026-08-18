import { NotFoundException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { AdminService } from './admin.service';
import type { PrismaService } from '../prisma/prisma.service';

function fila(overrides: Record<string, unknown> = {}) {
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

/// Mock mínimo: cada test pasa las funciones de Prisma que necesita.
function servicio(prisma: Partial<Record<string, unknown>>) {
  return new AdminService({ participant: prisma } as unknown as PrismaService);
}

describe('AdminService.listar', () => {
  it('solo pide participantes y marca activo desde disabledAt', async () => {
    let whereRecibido: unknown;
    const admin = servicio({
      findMany: (args: { where: unknown }) => {
        whereRecibido = args.where;
        return Promise.resolve([
          fila(),
          fila({ id: 'p2', disabledAt: new Date() }),
        ]);
      },
    });

    const lista = await admin.listar();

    expect(whereRecibido).toEqual({ role: 'PARTICIPANT' });
    expect(lista[0]).toMatchObject({ id: 'p1', activo: true });
    // El seudónimo es la llave de pareo con el pre/post-test, y tiene que ser
    // el mismo código que emite `entrenamiento` para esa misma `seq`.
    expect(lista[0].seudonimo).toBe('P007');
    expect(lista[1]).toMatchObject({ id: 'p2', activo: false });
    // Nunca sale cédula ni hash.
    expect(JSON.stringify(lista)).not.toContain('passwordHash');
    expect(JSON.stringify(lista)).not.toContain('cedula');
  });
});

describe('AdminService.cambiarEstado', () => {
  it('desactiva fijando disabledAt', async () => {
    let dataRecibido: { disabledAt: Date | null } | undefined;
    const admin = servicio({
      findFirst: () => Promise.resolve(fila()),
      update: (args: { data: { disabledAt: Date | null } }) => {
        dataRecibido = args.data;
        return Promise.resolve(fila({ disabledAt: args.data.disabledAt }));
      },
    });

    const res = await admin.cambiarEstado('p1', false);

    expect(dataRecibido?.disabledAt).toBeInstanceOf(Date);
    expect(res.activo).toBe(false);
  });

  it('404 si el id no es de un participante', async () => {
    const admin = servicio({ findFirst: () => Promise.resolve(null) });
    await expect(admin.cambiarEstado('sup', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AdminService.restablecerPassword', () => {
  it('devuelve una contraseña nueva y guarda su hash, no el claro', async () => {
    let hashGuardado: string | undefined;
    const admin = servicio({
      findFirst: () => Promise.resolve(fila()),
      update: (args: { data: { passwordHash: string } }) => {
        hashGuardado = args.data.passwordHash;
        return Promise.resolve(fila());
      },
    });

    const { password } = await admin.restablecerPassword('p1');

    expect(password).toHaveLength(12);
    expect(hashGuardado).toBeDefined();
    expect(hashGuardado).not.toContain(password);
    expect(await compare(password, hashGuardado as string)).toBe(true);
  });
});

describe('AdminService.eliminar', () => {
  it('borra a un participante', async () => {
    let borrado: unknown;
    const admin = servicio({
      findFirst: () => Promise.resolve({ id: 'p1' }),
      delete: (args: { where: unknown }) => {
        borrado = args.where;
        return Promise.resolve(fila());
      },
    });

    await admin.eliminar('p1');
    expect(borrado).toEqual({ id: 'p1' });
  });

  it('404 si el id no es de un participante (p.ej. un supervisor)', async () => {
    const admin = servicio({ findFirst: () => Promise.resolve(null) });
    await expect(admin.eliminar('sup')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
