import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  createTestApp,
  responseBody,
  cleanDatabase,
  registrationData,
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

  /// Registra un participante y devuelve su id y token.
  async function newParticipant(suffix: string) {
    const data = registrationData(suffix);
    const res = await server()
      .post('/api/auth/register')
      .send(data)
      .expect(201);
    const session = responseBody<SessionBody>(res);
    return {
      id: session.participant.id,
      datos: data,
      token: session.accessToken,
    };
  }

  let supervisorToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanDatabase(prisma);

    // Un supervisor: se registra como cualquiera y luego se le sube el rol en
    // la base (en producción lo hace `pnpm seed`).
    const sup = registrationData('supervisor');
    const res = await server().post('/api/auth/register').send(sup).expect(201);
    await prisma.participant.update({
      where: { id: responseBody<SessionBody>(res).participant.id },
      data: { role: 'SUPERVISOR' },
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
        .send({ activo: false, role: 'SUPERVISOR' })
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

    it('404 al intentar gestionar a un supervisor (no es participante)', async () => {
      const sup = await prisma.participant.findFirst({
        where: { role: 'SUPERVISOR' },
        select: { id: true },
      });

      await server()
        .delete(`/api/admin/participantes/${sup?.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(404);
    });
  });
});
