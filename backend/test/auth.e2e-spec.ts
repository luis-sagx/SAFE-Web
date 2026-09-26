import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { MailService } from '../apps/identidad/src/mail/mail.service';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  getRefreshCookie,
  createTestApp,
  responseBody,
  cleanDatabase,
  registerConfirmedSession,
  tokenFromLink,
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

  // El token nunca sale por la API (solo se guarda su hash): la única forma
  // de conseguirlo en un e2e es leer el enlace del `jest.fn` que reemplaza a
  // Resend (ver identidad.e2e.ts). `MailService.sendPasswordReset` no es un
  // jest.Mock en su tipo real, solo en este override de pruebas.
  function sendPasswordReset(): jest.Mock {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const mail = app.get(MailService) as { sendPasswordReset: jest.Mock };
    return mail.sendPasswordReset;
  }

  // Igual que sendPasswordReset(), pero para el enlace de confirmación de
  // correo que manda register()/resendConfirmation().
  function sendEmailConfirmation(): jest.Mock {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const mail = app.get(MailService) as {
      sendEmailConfirmation: jest.Mock;
    };
    return mail.sendEmailConfirmation;
  }

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
    it('crea el participante sin confirmar y solo devuelve el correo', async () => {
      sendEmailConfirmation().mockClear();

      const res = await server()
        .post('/api/auth/register')
        .send(registrationData('alta'))
        .expect(201);

      // Ya no hay sesión inmediata: el contrato nuevo (issue #295) exige
      // confirmar el correo antes de poder iniciar sesión.
      expect(responseBody<{ email: string }>(res)).toEqual({
        email: 'maria.alta@ejemplo.ec',
      });

      // El intento de notificar es la prueba de que la cuenta se creó de
      // verdad: el correo real está cifrado en la base (ver el siguiente
      // bloque de tests), así que no se busca ahí.
      expect(sendEmailConfirmation()).toHaveBeenCalledWith(
        'maria.alta@ejemplo.ec',
        expect.any(String),
        expect.stringContaining('/confirmar-correo?token='),
      );

      const saved = await prisma.participant.findFirst({
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      expect(saved?.emailConfirmedAt).toBeNull();
    });

    it('no devuelve el hash de la contraseña, el seudónimo ni la cédula', async () => {
      const data = registrationData('privacidad');
      const res = await server()
        .post('/api/auth/register')
        .send(data)
        .expect(201);

      const body = responseBody<Record<string, unknown>>(res);
      expect(body.passwordHash).toBeUndefined();
      expect(body.seq).toBeUndefined();
      expect(body.cedulaHash).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain(PASSWORD_TEST);
      expect(JSON.stringify(body)).not.toContain(data.cedula);
    });

    // La regla que sostiene el diseño de privacidad: la cédula solo existe el
    // tiempo de calcular su HMAC. Si alguien la guardara en claro "por si
    // acaso", esto lo atrapa.
    it('nunca guarda la cédula en claro, solo su huella', async () => {
      const data = registrationData('cedula');
      await server().post('/api/auth/register').send(data).expect(201);

      // Registro fresco: en este archivo no hay registros concurrentes, así
      // que la fila más reciente es la que se acaba de crear.
      const saved = await prisma.participant.findFirst({
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(saved?.cedulaHash).toEqual(expect.any(String));
      expect(saved?.cedulaHash).not.toContain(data.cedula);
      expect(JSON.stringify(saved)).not.toContain(data.cedula);
    });

    // La regla que sostiene el issue #95: quien se lleve solo la base no
    // debe poder leer nombre, apellido ni correo, aunque la app sí pueda,
    // descifrándolos con la clave que vive solo en el servidor.
    it('nunca guarda nombre, apellido ni correo en claro', async () => {
      const data = registrationData('cifrado');
      await server().post('/api/auth/register').send(data).expect(201);

      const saved = await prisma.participant.findFirst({
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(saved?.nombre).toMatch(/^v1:/);
      expect(saved?.apellido).toMatch(/^v1:/);
      expect(saved?.email).toMatch(/^v1:/);
      expect(saved?.nombre).not.toBe(data.nombre);
      expect(saved?.email).not.toBe(data.email);
      expect(JSON.stringify(saved)).not.toContain(data.email);
    });

    it('normaliza el correo y acepta la cédula con guiones', async () => {
      const data = registrationData('normaliza');
      sendEmailConfirmation().mockClear();

      await server()
        .post('/api/auth/register')
        .send({
          ...data,
          email: '  Maria.NORMALIZA@Ejemplo.ec ',
          cedula: `${data.cedula.slice(0, 9)}-${data.cedula.slice(9)}`,
        })
        .expect(201);

      // El correo normalizado se ve en el propio enlace de confirmación,
      // que lleva el correo en claro solo hasta llegar a la bandeja de la
      // persona (nunca a la base).
      expect(sendEmailConfirmation()).toHaveBeenCalledWith(
        'maria.normaliza@ejemplo.ec',
        expect.any(String),
        expect.any(String),
      );

      const saved = await prisma.participant.findFirst({
        orderBy: { createdAt: 'desc' },
        take: 1,
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
        .send({ ...registrationData('escalada'), role: 'ADMIN' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let confirmed: { email: string };

    beforeAll(async () => {
      const { datos } = await registerConfirmedSession(app, 'login');
      confirmed = { email: datos.email };
    });

    it('entrega un token con las credenciales correctas', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: confirmed.email, password: PASSWORD_TEST })
        .expect(200);

      expect(typeof responseBody<SessionBody>(res).accessToken).toBe('string');
    });

    // El registro ya lo comprobaba; el login no, y ahí sí se llegó a filtrar
    // el passwordHash por devolver el registro entero en vez de un `select`.
    it('tampoco devuelve el hash de la contraseña ni la huella de la cédula', async () => {
      const res = await server()
        .post('/api/auth/login')
        .send({ email: confirmed.email, password: PASSWORD_TEST })
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
        .send({ email: confirmed.email, password: PASSWORD_INVALID })
        .expect(401);

      expect(responseBody<ErrorBody>(nonexistent).message).toBe(
        responseBody<ErrorBody>(wrongPasswordResponse).message,
      );
    });

    // El corazón del issue #295: sin confirmar el correo, no se entra.
    it('rechaza el login de un participante que no confirmó su correo', async () => {
      const data = registrationData('sin-confirmar');
      await server().post('/api/auth/register').send(data).expect(201);

      const res = await server()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(401);

      expect(responseBody<ErrorBody>(res).message).toContain(
        'Confirma tu correo',
      );
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const { session } = await registerConfirmedSession(app, 'perfil');
      token = session.accessToken;
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
      const { session } = await registerConfirmedSession(app, 'onboarding');
      token = session.accessToken;
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
        { onboardingVisto: true, role: 'ADMIN' },
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
    // httpOnly que puso login/refresh (el registro ya no abre sesión).
    // `cookieRefresh` la extrae de `Set-Cookie`, tal como haría el
    // navegador solo, sin que JS la toque.
    it('pone la cookie del refresh token, httpOnly y restringida a esta ruta', async () => {
      const { session } = await registerConfirmedSession(app, 'refresh-cookie');

      expect(session).not.toHaveProperty('refreshToken');

      const res = await server()
        .post('/api/auth/login')
        .send({
          email: 'maria.refresh-cookie@ejemplo.ec',
          password: PASSWORD_TEST,
        })
        .expect(200);

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
      const { datos } = await registerConfirmedSession(app, 'refresh');
      const loginRes = await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(200);
      const originalCookie = getRefreshCookie(loginRes);

      const res = await server()
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .expect(200);

      const refreshedSession = responseBody<SessionBody>(res);
      expect(typeof refreshedSession.accessToken).toBe('string');
      expect(refreshedSession).not.toHaveProperty('refreshToken');
      // Rotación: el refresh también pone una cookie nueva (mismo nombre,
      // mismo `sub`, puede coincidir byte a byte con la original si cae en
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
      const { session } = await registerConfirmedSession(app, 'refresh-typ');
      const { accessToken } = session;

      await server()
        .post('/api/auth/refresh')
        .set('Cookie', `mic-refresh-token=${accessToken}`)
        .expect(401);
    });

    // Y a la inversa: el refresh token nunca debe abrir una ruta protegida
    // como si fuera un access token.
    it('rechaza un refresh token usado como access token', async () => {
      const { datos } = await registerConfirmedSession(app, 'refresh-typ-2');
      const loginRes = await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(200);
      const refreshToken = getRefreshCookie(loginRes).split('=')[1];

      await server()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });

    it('rechaza el refresh de una cuenta desactivada', async () => {
      const { session, datos } = await registerConfirmedSession(
        app,
        'refresh-desactivada',
      );
      const loginRes = await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(200);
      const cookie = getRefreshCookie(loginRes);

      await prisma.participant.update({
        where: { id: session.participant.id },
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

  describe('POST /api/auth/confirm-email', () => {
    it('con un token vigente, confirma la cuenta y deja iniciar sesión', async () => {
      const data = registrationData('confirmar');
      sendEmailConfirmation().mockClear();
      await server().post('/api/auth/register').send(data).expect(201);

      const [, , link] = sendEmailConfirmation().mock.calls[0] as [
        string,
        string,
        string,
      ];

      await server()
        .post('/api/auth/confirm-email')
        .send({ token: tokenFromLink(link) })
        .expect(204);

      await server()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(200);
    });

    it('rechaza un token inventado o inexistente con el mensaje genérico', async () => {
      const res = await server()
        .post('/api/auth/confirm-email')
        .send({ token: 'no-es-un-token-real' })
        .expect(401);

      expect(responseBody<ErrorBody>(res).message).toBe(
        'El enlace no es válido o ya venció.',
      );
    });

    it('un token ya usado no sirve una segunda vez', async () => {
      const data = registrationData('confirmar-reuso');
      sendEmailConfirmation().mockClear();
      await server().post('/api/auth/register').send(data).expect(201);
      const [, , link] = sendEmailConfirmation().mock.calls[0] as [
        string,
        string,
        string,
      ];
      const token = tokenFromLink(link);

      await server()
        .post('/api/auth/confirm-email')
        .send({ token })
        .expect(204);

      await server()
        .post('/api/auth/confirm-email')
        .send({ token })
        .expect(401);
    });
  });

  describe('POST /api/auth/resend-confirmation', () => {
    it('genera un token nuevo que reemplaza al anterior', async () => {
      const data = registrationData('reenvio');
      sendEmailConfirmation().mockClear();
      await server().post('/api/auth/register').send(data).expect(201);
      const [, , firstLink] = sendEmailConfirmation().mock.calls[0] as [
        string,
        string,
        string,
      ];
      const firstToken = tokenFromLink(firstLink);

      sendEmailConfirmation().mockClear();
      await server()
        .post('/api/auth/resend-confirmation')
        .send({ email: data.email })
        .expect(204);

      const [, , secondLink] = sendEmailConfirmation().mock.calls[0] as [
        string,
        string,
        string,
      ];
      const secondToken = tokenFromLink(secondLink);

      expect(secondToken).not.toBe(firstToken);

      // El token viejo ya no sirve...
      await server()
        .post('/api/auth/confirm-email')
        .send({ token: firstToken })
        .expect(401);
      // ...el nuevo sí.
      await server()
        .post('/api/auth/confirm-email')
        .send({ token: secondToken })
        .expect(204);
    });

    // Distinguirlos permitiría averiguar qué correos están registrados.
    it('responde el mismo 204 aunque el correo no exista, sin mandar nada', async () => {
      sendEmailConfirmation().mockClear();

      await server()
        .post('/api/auth/resend-confirmation')
        .send({ email: 'nadie-registrado@ejemplo.ec' })
        .expect(204);

      expect(sendEmailConfirmation()).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeAll(async () => {
      // forgotPassword no exige el correo confirmado (issue #295 no lo
      // cambió): un registro sin confirmar basta para este bloque.
      await server()
        .post('/api/auth/register')
        .send(registrationData('olvido'))
        .expect(201);
    });

    it('con una cuenta real, responde 204 y manda el correo con un enlace', async () => {
      sendPasswordReset().mockClear();

      await server()
        .post('/api/auth/forgot-password')
        .send({ email: 'maria.olvido@ejemplo.ec' })
        .expect(204);

      expect(sendPasswordReset()).toHaveBeenCalledWith(
        'maria.olvido@ejemplo.ec',
        expect.any(String),
        expect.stringContaining('/restablecer-password?token='),
      );
    });

    // Distinguirlos permitiría averiguar qué correos están registrados.
    it('responde el mismo 204 aunque el correo no exista, sin mandar nada', async () => {
      sendPasswordReset().mockClear();

      await server()
        .post('/api/auth/forgot-password')
        .send({ email: 'nadie-registrado@ejemplo.ec' })
        .expect(204);

      expect(sendPasswordReset()).not.toHaveBeenCalled();
    });

    it('rechaza un correo con formato inválido', async () => {
      await server()
        .post('/api/auth/forgot-password')
        .send({ email: 'no-es-un-correo' })
        .expect(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('con un token vigente, cambia la contraseña y deja entrar con la nueva', async () => {
      // El login final exige la cuenta confirmada, así que aquí sí se pasa
      // por el flujo completo (registrar → confirmar) antes de forgot/reset.
      const { datos } = await registerConfirmedSession(app, 'reset');
      sendPasswordReset().mockClear();
      await server()
        .post('/api/auth/forgot-password')
        .send({ email: datos.email })
        .expect(204);
      const [, , link] = sendPasswordReset().mock.calls[0] as [
        string,
        string,
        string,
      ];

      await server()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLink(link), password: PASSWORD_INVALID })
        .expect(204);

      // La contraseña vieja ya no sirve...
      await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: PASSWORD_TEST })
        .expect(401);
      // ...la nueva sí.
      await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: PASSWORD_INVALID })
        .expect(200);
    });

    it('un token ya usado no sirve una segunda vez', async () => {
      const { datos } = await registerConfirmedSession(app, 'reset-reuso');
      sendPasswordReset().mockClear();
      await server()
        .post('/api/auth/forgot-password')
        .send({ email: datos.email })
        .expect(204);
      const [, , link] = sendPasswordReset().mock.calls[0] as [
        string,
        string,
        string,
      ];
      const token = tokenFromLink(link);

      await server()
        .post('/api/auth/reset-password')
        .send({ token, password: PASSWORD_INVALID })
        .expect(204);

      await server()
        .post('/api/auth/reset-password')
        .send({ token, password: 'Tercera-Clave-000!' })
        .expect(401);
    });

    it('rechaza un token inventado', async () => {
      await server()
        .post('/api/auth/reset-password')
        .send({ token: 'no-es-un-token-real', password: PASSWORD_INVALID })
        .expect(401);
    });

    it('rechaza una contraseña que no cumple la política', async () => {
      const data = registrationData('reset-debil');
      // La política de reset-password no depende de que el correo esté
      // confirmado: forgotPassword tampoco lo exige.
      await server().post('/api/auth/register').send(data).expect(201);
      sendPasswordReset().mockClear();
      await server()
        .post('/api/auth/forgot-password')
        .send({ email: data.email })
        .expect(204);
      const [, , link] = sendPasswordReset().mock.calls[0] as [
        string,
        string,
        string,
      ];

      await server()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLink(link), password: 'corta' })
        .expect(400);
    });

    // Cierra sesiones abiertas en otros dispositivos (issue #256).
    it('invalida un refresh token emitido antes del restablecimiento', async () => {
      const { datos } = await registerConfirmedSession(app, 'reset-sesiones');
      const loginRes = await server()
        .post('/api/auth/login')
        .send({ email: datos.email, password: datos.password })
        .expect(200);
      const oldCookie = getRefreshCookie(loginRes);

      sendPasswordReset().mockClear();
      await server()
        .post('/api/auth/forgot-password')
        .send({ email: datos.email })
        .expect(204);
      const [, , link] = sendPasswordReset().mock.calls[0] as [
        string,
        string,
        string,
      ];
      await server()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLink(link), password: PASSWORD_INVALID })
        .expect(204);

      await server()
        .post('/api/auth/refresh')
        .set('Cookie', oldCookie)
        .expect(401);
    });
  });
});
