import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  getRefreshCookie,
  createTestApp,
  responseBody,
  cleanDatabase,
  PASSWORD_INVALID,
  PASSWORD_TEST,
  registrationData,
  type ErrorBody,
  type ProfileBody,
  type SessionBody,
} from './identidad.e2e';

describe('Autenticación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('GET /api/health responde ok', async () => {
    const res = await server().get('/api/health').expect(200);

    expect(responseBody<{ status: string }>(res).status).toBe('ok');
  });

  describe('POST /api/auth/register', () => {
    it('crea el participante y devuelve un token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('alta'))
        .expect(201);

      const session = responseBody<SessionBody>(res);
      expect(typeof session.accessToken).toBe('string');
      expect(session.participant).toMatchObject({
        nombre: 'María',
        apellido: 'Pérez',
        email: 'maria.alta@ejemplo.ec',
        role: 'PARTICIPANT',
      });
    });

    it('no devuelve el hash de la contraseña, el seudónimo ni la cédula', async () => {
      const data = registrationData('privacidad');
      const res = await server()
        .post('/api/auth/register')
        .send(data)
        .expect(201);

      const session = responseBody<SessionBody>(res);
      expect(session.participant.passwordHash).toBeUndefined();
      expect(session.participant.seq).toBeUndefined();
      expect(session.participant.cedulaHash).toBeUndefined();
      expect(JSON.stringify(session)).not.toContain(PASSWORD_TEST);
      expect(JSON.stringify(session)).not.toContain(data.cedula);
    });

    // La regla que sostiene el diseño de privacidad: la cédula solo existe el
    // tiempo de calcular su HMAC. Si alguien la guardara en claro "por si
    // acaso", esto lo atrapa.
    it('nunca guarda la cédula en claro, solo su huella', async () => {
      const data = registrationData('cedula');
      const res = await server()
        .post('/api/auth/register')
        .send(data)
        .expect(201);
      const { id } = responseBody<SessionBody>(res).participant;

      const saved = await prisma.participant.findUnique({
        where: { id },
      });

      expect(saved?.cedulaHash).toEqual(expect.any(String));
      expect(saved?.cedulaHash).not.toContain(data.cedula);
      expect(JSON.stringify(saved)).not.toContain(data.cedula);
    });

    // La regla que sostiene el issue #95: quien se lleve solo la base no
    // debe poder leer nombre, apellido ni correo — aunque la app sí pueda,
    // descifrándolos con la clave que vive solo en el servidor.
    it('nunca guarda nombre, apellido ni correo en claro', async () => {
      const data = registrationData('cifrado');
      const res = await server()
        .post('/api/auth/register')
        .send(data)
        .expect(201);
      const { id } = responseBody<SessionBody>(res).participant;

      const saved = await prisma.participant.findUnique({ where: { id } });

      expect(saved?.nombre).toMatch(/^v1:/);
      expect(saved?.apellido).toMatch(/^v1:/);
      expect(saved?.email).toMatch(/^v1:/);
      expect(saved?.nombre).not.toBe(data.nombre);
      expect(saved?.email).not.toBe(data.email);
      expect(JSON.stringify(saved)).not.toContain(data.email);

      // Pero la app sí lo descifra de vuelta para quien tiene sesión.
      expect(responseBody<SessionBody>(res).participant.email).toBe(data.email);
      expect(responseBody<SessionBody>(res).participant.nombre).toBe(
        data.nombre,
      );
    });

    it('normaliza el correo y acepta la cédula con guiones', async () => {
      const data = registrationData('normaliza');
      const res = await server()
        .post('/api/auth/register')
        .send({
          ...data,
          email: '  Maria.NORMALIZA@Ejemplo.ec ',
          cedula: `${data.cedula.slice(0, 9)}-${data.cedula.slice(9)}`,
        })
        .expect(201);

      // El correo normalizado se ve en la propia respuesta —descifrado de
      // vuelta por el servidor—, así que no hace falta releer la base para
      // comprobar que se guardó en minúsculas y sin espacios.
      expect(responseBody<SessionBody>(res).participant.email).toBe(
        'maria.normaliza@ejemplo.ec',
      );

      const saved = await prisma.participant.findUnique({
        where: { id: responseBody<SessionBody>(res).participant.id },
      });

      expect(saved?.cedulaHash).toEqual(expect.any(String));
    });

    // Dos cuentas de la misma persona parten sus corridas en el análisis.
    it('rechaza un correo ya registrado aunque cambie la capitalización', async () => {
      const data = registrationData('duplicado');
      await server().post('/api/auth/register').send(data).expect(201);

      await server()
        .post('/api/auth/register')
        .send({
          ...registrationData('duplicado-2'),
          email: 'MARIA.DUPLICADO@ejemplo.ec',
        })
        .expect(409);
    });

    // El motivo por el que se pide la cédula: una persona, una cuenta.
    it('rechaza una cédula ya registrada aunque el correo sea otro', async () => {
      const data = registrationData('cedula-unica');
      await server().post('/api/auth/register').send(data).expect(201);

      await server()
        .post('/api/auth/register')
        .send({
          ...registrationData('cedula-unica-2'),
          cedula: data.cedula,
        })
        .expect(409);
    });

    // Distinguirlos diría si una persona concreta participó en el estudio.
    it('da el mismo error para correo repetido que para cédula repetida', async () => {
      const data = registrationData('mismo-error');
      await server().post('/api/auth/register').send(data).expect(201);

      const byEmail = await server()
        .post('/api/auth/register')
        .send({ ...registrationData('mismo-error-a'), email: data.email })
        .expect(409);

      const byEcuadorianId = await server()
        .post('/api/auth/register')
        .send({ ...registrationData('mismo-error-b'), cedula: data.cedula })
        .expect(409);

      expect(responseBody<ErrorBody>(byEmail).message).toEqual(
        responseBody<ErrorBody>(byEcuadorianId).message,
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
    ])('rechaza el registro con %s', async (_case, override) => {
      await server()
        .post('/api/auth/register')
        .send({ ...registrationData('invalido'), ...override })
        .expect(400);
    });

    it('rechaza campos que no están en el DTO', async () => {
      await server()
        .post('/api/auth/register')
        .send({ ...registrationData('escalada'), role: 'SUPERVISOR' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await server()
        .post('/api/auth/register')
        .send(registrationData('login'))
        .expect(201);
    });

    it('entrega un token con las credenciales correctas', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.ec', password: PASSWORD_TEST })
        .expect(200);

      expect(typeof responseBody<SessionBody>(res).accessToken).toBe('string');
    });

    // El registro ya lo comprobaba; el login no, y ahí sí se llegó a filtrar
    // el passwordHash por devolver el registro entero en vez de un `select`.
    it('tampoco devuelve el hash de la contraseña ni la huella de la cédula', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.ec', password: PASSWORD_TEST })
        .expect(200);

      const session = responseBody<SessionBody>(res);
      expect(session.participant.passwordHash).toBeUndefined();
      expect(session.participant.cedulaHash).toBeUndefined();
      expect(session.participant.seq).toBeUndefined();
      expect(JSON.stringify(session)).not.toContain('$2b$');
    });

    // Distinguirlos revelaría qué correos están registrados.
    it('no distingue entre correo inexistente y contraseña incorrecta', async () => {
      const nonexistent = await server()
        .post('/api/auth/login')
        .send({ email: 'nadie@ejemplo.ec', password: PASSWORD_TEST })
        .expect(401);

      const wrongPasswordResponse = await server()
        .post('/api/auth/login')
        .send({ email: 'maria.login@ejemplo.ec', password: PASSWORD_INVALID })
        .expect(401);

      expect(responseBody<ErrorBody>(nonexistent).message).toBe(
        responseBody<ErrorBody>(wrongPasswordResponse).message,
      );
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('perfil'));
      token = responseBody<SessionBody>(res).accessToken;
    });

    it('devuelve el perfil del token', async () => {
      const res = await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const profile = responseBody<ProfileBody>(res);
      expect(profile.email).toBe('maria.perfil@ejemplo.ec');
      expect(profile.passwordHash).toBeUndefined();
    });

    // Nunca vio la bienvenida: recién se registró.
    it('empieza con onboardingVisto en false', async () => {
      const res = await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(responseBody<ProfileBody>(res).onboardingVisto).toBe(false);
    });

    it.each([
      ['sin cabecera', undefined],
      [
        'con esquema equivocado',
        'Basic ' + Buffer.from('a:b').toString('base64'),
      ],
      ['con token inventado', 'Bearer no.es.un.token'],
    ])('responde 401 %s', async (_case, header) => {
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
        .send(registrationData('onboarding'));
      token = responseBody<SessionBody>(res).accessToken;
    });

    it('marca onboardingVisto y luego lo puede volver a desmarcar', async () => {
      const seen = await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ onboardingVisto: true })
        .expect(200);
      expect(responseBody<ProfileBody>(seen).onboardingVisto).toBe(true);

      // El ícono ⓘ reactiva el aviso: debe poder volver a false.
      const again = await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ onboardingVisto: false })
        .expect(200);
      expect(responseBody<ProfileBody>(again).onboardingVisto).toBe(false);
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
    ])('rechaza %s', async (_case, body) => {
      await server()
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    // El refresh token nunca aparece en el JSON: viaja solo en una cookie
    // httpOnly que puso register/login. `cookieRefresh` la extrae de
    // `Set-Cookie`, tal como haría el navegador solo, sin que JS la toque.
    it('pone la cookie del refresh token, httpOnly y restringida a esta ruta', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('refresh-cookie'))
        .expect(201);

      const cookie = (res.headers['set-cookie'] as unknown as string[]).find(
        (c) => c.startsWith('mic-refresh-token='),
      );

      expect(cookie).toBeDefined();
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api/auth/refresh');
      expect(responseBody<SessionBody>(res)).not.toHaveProperty('refreshToken');
    });

    it('entrega un access token nuevo y rota la cookie', async () => {
      const registered = await server()
        .post('/api/auth/register')
        .send(registrationData('refresh'))
        .expect(201);
      const originalCookie = getRefreshCookie(registered);

      const res = await server()
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .expect(200);

      const refreshedSession = responseBody<SessionBody>(res);
      expect(typeof refreshedSession.accessToken).toBe('string');
      expect(refreshedSession).not.toHaveProperty('refreshToken');
      // Rotación: el refresh también pone una cookie nueva (mismo nombre,
      // mismo `sub` — puede coincidir byte a byte con la original si cae en
      // el mismo segundo de `iat`, así que no se compara el valor).
      expect(getRefreshCookie(res)).toBeDefined();

      // El access token nuevo sirve de verdad en una ruta protegida.
      await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshedSession.accessToken}`)
        .expect(200);
    });

    it('rechaza cuando no hay cookie', async () => {
      await server().post('/api/auth/refresh').expect(401);
    });

    it('rechaza una cookie con un token inventado', async () => {
      await server()
        .post('/api/auth/refresh')
        .set('Cookie', 'mic-refresh-token=no.es.un.token')
        .expect(401);
    });

    // La garantía que sostiene todo el diseño: sin la marca `typ`, un access
    // token (vida corta, pero el único que un atacante suele conseguir robar
    // vía XSS, ya que el refresh es httpOnly) podría reutilizarse aquí para
    // sacar un refresh token de vida larga.
    it('rechaza un access token usado como refresh token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('refresh-typ'))
        .expect(201);
      const { accessToken } = responseBody<SessionBody>(res);

      await server()
        .post('/api/auth/refresh')
        .set('Cookie', `mic-refresh-token=${accessToken}`)
        .expect(401);
    });

    // Y a la inversa: el refresh token nunca debe abrir una ruta protegida
    // como si fuera un access token.
    it('rechaza un refresh token usado como access token', async () => {
      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('refresh-typ-2'))
        .expect(201);
      const refreshToken = getRefreshCookie(res).split('=')[1];

      await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });

    it('rechaza el refresh de una cuenta desactivada', async () => {
      const data = registrationData('refresh-desactivada');
      const res = await server()
        .post('/api/auth/register')
        .send(data)
        .expect(201);
      const cookie = getRefreshCookie(res);

      await prisma.participant.update({
        where: { id: responseBody<SessionBody>(res).participant.id },
        data: { disabledAt: new Date() },
      });

      await server()
        .post('/api/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('borra la cookie del refresh token', async () => {
      const res = await server().post('/api/auth/logout').expect(204);

      const cookie = (res.headers['set-cookie'] as unknown as string[]).find(
        (c) => c.startsWith('mic-refresh-token='),
      );

      // Borrar una cookie es ponerla vacía con fecha de expiración pasada.
      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/mic-refresh-token=;/);
    });
  });
});
