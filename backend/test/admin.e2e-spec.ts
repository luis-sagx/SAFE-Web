import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  crearApp,
  cuerpo,
  limpiar,
  registro,
  type SesionBody,
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
    return cuerpo<SesionBody>(res).accessToken;
  }

  /// Registra un participante y devuelve su id y token.
  async function nuevoParticipante(sufijo: string) {
    const datos = registro(sufijo);
    const res = await server()
      .post('/api/auth/register')
      .send(datos)
      .expect(201);
    const sesion = cuerpo<SesionBody>(res);
    return { id: sesion.participant.id, datos, token: sesion.accessToken };
  }

  let supervisorToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiar(prisma);

    // Un supervisor: se registra como cualquiera y luego se le sube el rol en
    // la base (en producción lo hace `pnpm seed`).
    const sup = registro('supervisor');
    await server().post('/api/auth/register').send(sup).expect(201);
    await prisma.participant.update({
      where: { email: sup.email },
      data: { role: 'SUPERVISOR' },
    });
    supervisorToken = await login(sup.email, sup.password);
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  describe('GET /api/admin/participantes', () => {
    it('401 sin token, 403 a un participante', async () => {
      const { token } = await nuevoParticipante('lista-guard');
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

      const texto = res.text;
      expect(texto).not.toContain('passwordHash');
      expect(texto).not.toContain('cedulaHash');

      const lista = cuerpo<Array<Record<string, unknown>>>(res);
      expect(lista.every((p) => p.activo === true)).toBe(true);
      // El supervisor no aparece: la lista es solo de participantes.
      expect(
        lista.some((p) => p.email === 'maria.supervisor@ejemplo.com'),
      ).toBe(false);
    });
  });

  describe('PATCH /api/admin/participantes/:id/estado', () => {
    it('desactivar bloquea el login; reactivar lo restablece', async () => {
      const { id, datos } = await nuevoParticipante('estado');

      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: false })
        .expect(200);

      // Credenciales correctas pero cuenta desactivada: 403, no 401.
      await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(403);

      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: true })
        .expect(200);

      await login(datos.email, datos.password);
    });

    it('rechaza un campo fuera del DTO (400)', async () => {
      const { id } = await nuevoParticipante('estado-whitelist');
      await server()
        .patch(`/api/admin/participantes/${id}/estado`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ activo: false, role: 'SUPERVISOR' })
        .expect(400);
    });
  });

  describe('POST /api/admin/participantes/:id/restablecer-password', () => {
    it('la contraseña nueva funciona y la vieja deja de servir', async () => {
      const { id, datos } = await nuevoParticipante('reset');

      const res = await server()
        .post(`/api/admin/participantes/${id}/restablecer-password`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const { password } = cuerpo<{ password: string }>(res);
      await login(datos.email, password);
      await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(401);
    });
  });

  describe('DELETE /api/admin/participantes/:id', () => {
    it('borra al participante', async () => {
      const { id, datos } = await nuevoParticipante('borrado');

      await server()
        .delete(`/api/admin/participantes/${id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(204);

      await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
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
