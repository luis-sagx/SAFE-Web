import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  createTestApp,
  responseBody,
  cleanDatabase,
  registerConfirmedSession,
  type SessionBody,
} from './identidad.e2e';

describe('Gestión de cuentas por el supervisor (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => request(app.getHttpServer() as App);

  async function login(email: string, password: string): Promise<string> {
    const res = await server()
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return responseBody<SessionBody>(res).accessToken;
  }

  /// Registra, confirma e inicia sesión un participante; devuelve su id y
  /// token. El registro ya no abre sesión por sí solo (issue #295).
  async function newParticipant(suffix: string) {
    const { session, datos } = await registerConfirmedSession(app, suffix);
    return {
      id: session.participant.id,
      datos,
      token: session.accessToken,
    };
  }

  let supervisorToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanDatabase(prisma);

    // Un supervisor: se registra, confirma e inicia sesión como cualquiera y
    // luego se le sube el rol en la base (en producción lo hace `pnpm
    // seed`). Subirle el rol después de confirmar evita depender de que un
    // ADMIN esté exento de la comprobación de correo confirmado en login.
    const { session, datos: sup } = await registerConfirmedSession(
      app,
      'supervisor',
    );
    await prisma.participant.update({
      where: { id: session.participant.id },
      data: { role: 'ADMIN' },
    });
    supervisorToken = await login(sup.email, sup.password);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('GET /api/admin/participantes', () => {
    it('401 sin token, 403 a un participante', async () => {
      const { token } = await newParticipant('lista-guard');
      await server().get('/api/admin/participantes').expect(401);
      await server()
        .get('/api/admin/participantes')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('el supervisor ve la lista, sin datos sensibles', async () => {
      const res = await server()
        .get('/api/admin/participantes')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const text = res.text;
      expect(text).not.toContain('passwordHash');
      expect(text).not.toContain('cedulaHash');

      const list = responseBody<Array<Record<string, unknown>>>(res);
      expect(list.every((p) => p.activo === true)).toBe(true);
      // El supervisor no aparece: la lista es solo de participantes.
      expect(list.some((p) => p.email === 'maria.supervisor@ejemplo.ec')).toBe(
        false,
      );
    });
  });

  describe('PATCH /api/admin/participantes/:id/estado', () => {
    it('desactivar bloquea el login; reactivar lo restablece', async () => {
      const { id, datos: data } = await newParticipant('estado');

      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: false })
        .expect(200);

      // Credenciales correctas pero cuenta desactivada: 403, no 401.
      await server()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(403);

      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: true })
        .expect(200);

      await login(data.email, data.password);
    });

    it('rechaza un campo fuera del DTO (400)', async () => {
      const { id } = await newParticipant('estado-whitelist');
      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: false, role: 'ADMIN' })
        .expect(400);
    });
  });

  describe('POST /api/admin/participantes/:id/restablecer-password', () => {
    it('la contraseña nueva funciona y la vieja deja de servir', async () => {
      const { id, datos: data } = await newParticipant('reset');

      const res = await server()
        .post(`/api/admin/participantes/${id}/restablecer-password`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const { password } = responseBody<{ password: string }>(res);
      await login(data.email, password);
      await server()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(401);
    });
  });

  describe('DELETE /api/admin/participantes/:id', () => {
    it('borra al participante', async () => {
      const { id, datos: data } = await newParticipant('borrado');

      await server()
        .delete(`/api/admin/participantes/${id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(204);

      await server()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(401);
    });

    it('404 al intentar gestionar a un administrador (no es participante)', async () => {
      const sup = await prisma.participant.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      await server()
        .delete(`/api/admin/participantes/${sup?.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(404);
    });
  });
});
