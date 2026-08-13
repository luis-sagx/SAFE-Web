import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  crearApp,
  cuerpo,
  limpiar,
  registro,
  type ErrorBody,
  type PerfilBody,
  type SesionBody,
} from './identidad.e2e';

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
        nombre: 'María',
        apellido: 'Pérez',
        email: 'maria.alta@ejemplo.com',
        role: 'PARTICIPANT',
      });
    });

    it('no devuelve el hash de la contraseña, el seudónimo ni la cédula', async () => {
      const datos = registro('privacidad');
      const res = await server()
        .post('/api/auth/register')
        .send(datos)
        .expect(201);

      const sesion = cuerpo<SesionBody>(res);
      expect(sesion.participant.passwordHash).toBeUndefined();
      expect(sesion.participant.seq).toBeUndefined();
      expect(sesion.participant.cedulaHash).toBeUndefined();
      expect(JSON.stringify(sesion)).not.toContain('clave-larga-123');
      expect(JSON.stringify(sesion)).not.toContain(datos.cedula);
    });

    // La regla que sostiene el diseño de privacidad: la cédula solo existe el
    // tiempo de calcular su HMAC. Si alguien la guardara en claro "por si
    // acaso", esto lo atrapa.
    it('nunca guarda la cédula en claro, solo su huella', async () => {
      const datos = registro('cedula');
      await server().post('/api/auth/register').send(datos).expect(201);

      const guardado = await prisma.participant.findUnique({
        where: { email: datos.email },
      });

      expect(guardado?.cedulaHash).toEqual(expect.any(String));
      expect(guardado?.cedulaHash).not.toContain(datos.cedula);
      expect(JSON.stringify(guardado)).not.toContain(datos.cedula);
    });

    it('normaliza el correo y acepta la cédula con guiones', async () => {
      const datos = registro('normaliza');
      await server()
        .post('/api/auth/register')
        .send({
          ...datos,
          email: '  Maria.NORMALIZA@Ejemplo.com ',
          cedula: `${datos.cedula.slice(0, 9)}-${datos.cedula.slice(9)}`,
        })
        .expect(201);

      const guardado = await prisma.participant.findUnique({
        where: { email: 'maria.normaliza@ejemplo.com' },
      });

      expect(guardado?.cedulaHash).toEqual(expect.any(String));
    });

    // Dos cuentas de la misma persona parten sus corridas en el análisis.
    it('rechaza un correo ya registrado aunque cambie la capitalización', async () => {
      const datos = registro('duplicado');
      await server().post('/api/auth/register').send(datos).expect(201);

      await server()
        .post('/api/auth/register')
        .send({
          ...registro('duplicado-2'),
          email: 'MARIA.DUPLICADO@ejemplo.com',
        })
        .expect(409);
    });

    // El motivo por el que se pide la cédula: una persona, una cuenta.
    it('rechaza una cédula ya registrada aunque el correo sea otro', async () => {
      const datos = registro('cedula-unica');
      await server().post('/api/auth/register').send(datos).expect(201);

      await server()
        .post('/api/auth/register')
        .send({
          ...registro('cedula-unica-2'),
          cedula: datos.cedula,
        })
        .expect(409);
    });

    // Distinguirlos diría si una persona concreta participó en el estudio.
    it('da el mismo error para correo repetido que para cédula repetida', async () => {
      const datos = registro('mismo-error');
      await server().post('/api/auth/register').send(datos).expect(201);

      const porCorreo = await server()
        .post('/api/auth/register')
        .send({ ...registro('mismo-error-a'), email: datos.email })
        .expect(409);

      const porCedula = await server()
        .post('/api/auth/register')
        .send({ ...registro('mismo-error-b'), cedula: datos.cedula })
        .expect(409);

      expect(cuerpo<ErrorBody>(porCorreo).message).toEqual(
        cuerpo<ErrorBody>(porCedula).message,
      );
    });

    it.each([
      ['correo inválido', { email: 'no-es-correo' }],
      ['contraseña corta', { password: 'corta' }],
      ['nombre de una letra', { nombre: 'M' }],
      ['sin apellido', { apellido: '' }],
      ['cédula con verificador incorrecto', { cedula: '1710034066' }],
      ['cédula de nueve dígitos', { cedula: '171003406' }],
      ['cédula con letras', { cedula: '17100340a5' }],
      ['cédula de provincia inexistente', { cedula: '2510034065' }],
    ])('rechaza el registro con %s', async (_caso, override) => {
      await server()
        .post('/api/auth/register')
        .send({ ...registro('invalido'), ...override })
        .expect(400);
    });

    it('rechaza campos que no están en el DTO', async () => {
      await server()
        .post('/api/auth/register')
        .send({ ...registro('escalada'), role: 'SUPERVISOR' })
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

    // El registro ya lo comprobaba; el login no, y ahí sí se llegó a filtrar
    // el passwordHash por devolver el registro entero en vez de un `select`.
    it('tampoco devuelve el hash de la contraseña ni la huella de la cédula', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.com', password: 'clave-larga-123' })
        .expect(200);

      const sesion = cuerpo<SesionBody>(res);
      expect(sesion.participant.passwordHash).toBeUndefined();
      expect(sesion.participant.cedulaHash).toBeUndefined();
      expect(sesion.participant.seq).toBeUndefined();
      expect(JSON.stringify(sesion)).not.toContain('$2b$');
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

    // Nunca vio la bienvenida: recién se registró.
    it('empieza con onboardingVisto en false', async () => {
      const res = await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(cuerpo<PerfilBody>(res).onboardingVisto).toBe(false);
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

  describe('PATCH /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('onboarding'));
      token = cuerpo<SesionBody>(res).accessToken;
    });

    it('marca onboardingVisto y luego lo puede volver a desmarcar', async () => {
      const visto = await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ onboardingVisto: true })
        .expect(200);
      expect(cuerpo<PerfilBody>(visto).onboardingVisto).toBe(true);

      // El ícono ⓘ reactiva el aviso: debe poder volver a false.
      const otraVez = await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ onboardingVisto: false })
        .expect(200);
      expect(cuerpo<PerfilBody>(otraVez).onboardingVisto).toBe(false);
    });

    it('exige token', async () => {
      await server()
        .patch('/api/auth/me')
        .send({ onboardingVisto: true })
        .expect(401);
    });

    // whitelist + forbidNonWhitelisted: es lo único que impide que esta ruta
    // se convierta en una puerta trasera para tocar cualquier otro campo.
    it.each([
      ['un campo que no es onboardingVisto', { nombre: 'Otro Nombre' }],
      [
        'un campo de más junto al válido',
        { onboardingVisto: true, role: 'SUPERVISOR' },
      ],
      ['un valor que no es booleano', { onboardingVisto: 'si' }],
      ['el cuerpo vacío', {}],
    ])('rechaza %s', async (_caso, body) => {
      await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('entrega un access token y un refresh token nuevos', async () => {
      const registrado = await server()
        .post('/api/auth/register')
        .send(registro('refresh'))
        .expect(201);
      const original = cuerpo<SesionBody>(registrado);

      const res = await server()
        .post('/api/auth/refresh')
        .send({ refreshToken: original.refreshToken })
        .expect(200);

      const renovado = cuerpo<SesionBody>(res);
      expect(typeof renovado.accessToken).toBe('string');
      expect(typeof renovado.refreshToken).toBe('string');

      // El access token nuevo sirve de verdad en una ruta protegida.
      await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${renovado.accessToken}`)
        .expect(200);
    });

    it('rechaza un refresh token inventado', async () => {
      await server()
        .post('/api/auth/refresh')
        .send({ refreshToken: 'no.es.un.token' })
        .expect(401);
    });

    // La garantía que sostiene todo el diseño: sin la marca `typ`, un access
    // token (vida corta, pero el único que un atacante suele conseguir robar)
    // podría reutilizarse aquí para sacar un refresh token de vida larga.
    it('rechaza un access token usado como refresh token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('refresh-typ'))
        .expect(201);
      const { accessToken } = cuerpo<SesionBody>(res);

      await server()
        .post('/api/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);
    });

    // Y a la inversa: el refresh token nunca debe abrir una ruta protegida
    // como si fuera un access token.
    it('rechaza un refresh token usado como access token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registro('refresh-typ-2'))
        .expect(201);
      const { refreshToken } = cuerpo<SesionBody>(res);

      await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });

    it('rechaza el refresh de una cuenta desactivada', async () => {
      const datos = registro('refresh-desactivada');
      const res = await server()
        .post('/api/auth/register')
        .send(datos)
        .expect(201);
      const { refreshToken } = cuerpo<SesionBody>(res);

      await prisma.participant.update({
        where: { email: datos.email },
        data: { disabledAt: new Date() },
      });

      await server()
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('rechaza el cuerpo sin refreshToken', async () => {
      await server().post('/api/auth/refresh').send({}).expect(400);
    });
  });
});
