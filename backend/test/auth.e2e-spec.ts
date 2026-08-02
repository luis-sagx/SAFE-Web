import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  crearApp,
  cuerpo,
  limpiar,
  registro,
  type ErrorBody,
  type PerfilBody,
  type SesionBody,
} from './app.e2e';

describe('Autenticación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiar(prisma);
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  it('GET /api/health responde ok', async () => {
    const res = await server().get('/api/health').expect(200);

    expect(cuerpo<{ status: string }>(res).status).toBe('ok');
  });

  describe('POST /api/auth/register', () => {
    it('crea el participante y devuelve un token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('alta'))
        .expect(201);

      const sesion = cuerpo<SesionBody>(res);
      expect(typeof sesion.accessToken).toBe('string');
      expect(sesion.participant).toMatchObject({
        nombre: 'María Pérez',
        email: 'maria.alta@ejemplo.com',
        role: 'PARTICIPANT',
      });
    });

    it('no devuelve el hash de la contraseña ni el seudónimo', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('privacidad'))
        .expect(201);

      const sesion = cuerpo<SesionBody>(res);
      expect(sesion.participant.passwordHash).toBeUndefined();
      expect(sesion.participant.seq).toBeUndefined();
      expect(JSON.stringify(sesion)).not.toContain('clave-larga-123');
    });

    it('normaliza el correo y el teléfono antes de guardarlos', async () => {
      await server()
        .post('/api/auth/register')
        .send({
          ...registro('normaliza'),
          email: '  Maria.NORMALIZA@Ejemplo.com ',
          telefono: '(099) 123-4567',
        })
        .expect(201);

      const guardado = await prisma.participant.findUnique({
        where: { email: 'maria.normaliza@ejemplo.com' },
      });

      expect(guardado?.telefono).toBe('0991234567');
    });

    // Dos cuentas de la misma persona parten sus corridas en el análisis.
    it('rechaza un correo ya registrado aunque cambie la capitalización', async () => {
      await server()
        .post('/api/auth/register')
        .send(registro('duplicado'))
        .expect(201);

      await server()
        .post('/api/auth/register')
        .send({
          ...registro('duplicado'),
          email: 'MARIA.DUPLICADO@ejemplo.com',
        })
        .expect(409);
    });

    it.each([
      ['correo inválido', { email: 'no-es-correo' }],
      ['contraseña corta', { password: 'corta' }],
      ['teléfono con letras', { telefono: 'cero-nueve-nueve' }],
      ['nombre de una letra', { nombre: 'M' }],
    ])('rechaza el registro con %s', async (_caso, override) => {
      await server()
        .post('/api/auth/register')
        .send({ ...registro('invalido'), ...override })
        .expect(400);
    });

    it('rechaza campos que no están en el DTO', async () => {
      await server()
        .post('/api/auth/register')
        .send({ ...registro('escalada'), role: 'RESEARCHER' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await server()
        .post('/api/auth/register')
        .send(registro('login'))
        .expect(201);
    });

    it('entrega un token con las credenciales correctas', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.com', password: 'clave-larga-123' })
        .expect(200);

      expect(typeof cuerpo<SesionBody>(res).accessToken).toBe('string');
    });

    // Distinguirlos revelaría qué correos están registrados.
    it('no distingue entre correo inexistente y contraseña incorrecta', async () => {
      const inexistente = await server()
        .post('/api/auth/login')
        .send({ email: 'nadie@ejemplo.com', password: 'clave-larga-123' })
        .expect(401);

      const claveMala = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.com', password: 'otra-clave-123' })
        .expect(401);

      expect(cuerpo<ErrorBody>(inexistente).message).toBe(
        cuerpo<ErrorBody>(claveMala).message,
      );
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('perfil'));
      token = cuerpo<SesionBody>(res).accessToken;
    });

    it('devuelve el perfil del token', async () => {
      const res = await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const perfil = cuerpo<PerfilBody>(res);
      expect(perfil.email).toBe('maria.perfil@ejemplo.com');
      expect(perfil.passwordHash).toBeUndefined();
    });

    it.each([
      ['sin cabecera', undefined],
      [
        'con esquema equivocado',
        'Basic ' + Buffer.from('a:b').toString('base64'),
      ],
      ['con token inventado', 'Bearer no.es.un.token'],
    ])('responde 401 %s', async (_caso, header) => {
      const req = server().get('/api/auth/me');
      if (header) req.set('Authorization', header);
      await req.expect(401);
    });
  });
});
