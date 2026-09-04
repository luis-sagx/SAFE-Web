import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AtestacionPayload, JwtPayload } from '@comun';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import { crearApp, cuerpo, limpiar, registro, type SesionBody } from './identidad.e2e';

interface CertificadoBody {
  codigo: string;
  emitidoAt: string;
  modulos: string[];
  horas: number;
}

interface VerificacionBody {
  valido: boolean;
  emitidoAt?: string;
  horas?: number;
  modulos?: string[];
}

const MODULOS = ['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa'];

describe('Certificados (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    jwt = app.get(JwtService);
    await limpiar(prisma);
  });

  afterAll(async () => {
    await limpiar(prisma);
    await app.close();
  });

  /// `identidad` nunca calcula el progreso: la atestación es lo único que
  /// `entrenamiento` firmaría en producción, y aquí se firma igual, con el
  /// mismo `JwtService` que ya comparten los dos servicios.
  function atestacion(payload: Partial<AtestacionPayload>): Promise<string> {
    return jwt.signAsync({
      sub: 'sin-usar',
      seq: 0,
      modulos: MODULOS,
      typ: 'atestacion',
      ...payload,
    } satisfies AtestacionPayload);
  }

  /// Registra un participante real y decodifica su propio access token para
  /// sacarle `sub`/`seq`: el perfil que devuelve `/auth/register` nunca trae
  /// `seq` (el participante no debe verlo), así que es el único lugar de
  /// donde tomarlo sin tocar la base a mano.
  async function participante(sufijo: string) {
    const res = await server().post('/api/auth/register').send(registro(sufijo)).expect(201);
    const sesion = cuerpo<SesionBody>(res);
    const payload = jwt.decode<JwtPayload>(sesion.accessToken);
    return { accessToken: sesion.accessToken, sub: payload.sub, seq: payload.seq };
  }

  describe('POST /api/certificados', () => {
    it('exige token de acceso', async () => {
      const pase = await atestacion({});
      await server().post('/api/certificados').send({ atestacion: pase }).expect(401);
    });

    it('rechaza una atestación firmada con otro secreto', async () => {
      const { accessToken } = await participante('cert-1');
      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: 'no.es.un-jwt-valido' })
        .expect(400);
    });

    it('rechaza un access token presentado como si fuera la atestación', async () => {
      const { accessToken } = await participante('cert-2');
      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: accessToken })
        .expect(403);
    });

    // La comprobación que sostiene todo el flujo: sin ella, la atestación de
    // otra persona serviría para emitirse un certificado con su progreso.
    it('rechaza una atestación de un participante distinto al que la presenta', async () => {
      const { accessToken } = await participante('cert-3');
      const deOtro = await atestacion({ sub: 'otro-participante', seq: 999 });

      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: deOtro })
        .expect(403);
    });

    it('emite el certificado y el mismo código al pedirlo dos veces', async () => {
      const { accessToken, sub, seq } = await participante('cert-4');
      const pase = await atestacion({ sub, seq });

      const primera = await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(201);

      const cuerpoUno = cuerpo<CertificadoBody>(primera);
      expect(cuerpoUno.codigo).toMatch(/^SW-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(cuerpoUno.horas).toBe(4);
      expect(cuerpoUno.modulos).toEqual(MODULOS);

      const segunda = await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(201);

      expect(cuerpo<CertificadoBody>(segunda).codigo).toBe(cuerpoUno.codigo);
    });
  });

  describe('POST /api/certificados/pdf', () => {
    it('devuelve el PDF de un certificado ya emitido', async () => {
      const { accessToken, sub, seq } = await participante('cert-5');
      const pase = await atestacion({ sub, seq });

      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(201);

      const res = await server()
        .post('/api/certificados/pdf')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .buffer(true)
        .parse((response, callback) => {
          const trozos: Buffer[] = [];
          response.on('data', (trozo: Buffer) => trozos.push(trozo));
          response.on('end', () => callback(null, Buffer.concat(trozos)));
        })
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect((res.body as Buffer).subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });

    it('sin certificado emitido, 404', async () => {
      const { accessToken, sub, seq } = await participante('cert-6');
      const pase = await atestacion({ sub, seq });

      await server()
        .post('/api/certificados/pdf')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(404);
    });
  });

  describe('GET /api/certificados/verificar/:codigo', () => {
    it('no exige sesión y no revela nombre alguno', async () => {
      const { accessToken, sub, seq } = await participante('cert-7');
      const pase = await atestacion({ sub, seq });
      const emitido = cuerpo<CertificadoBody>(
        await server()
          .post('/api/certificados')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ atestacion: pase })
          .expect(201),
      );

      const res = await server()
        .get(`/api/certificados/verificar/${emitido.codigo}`)
        .expect(200);

      const cuerpoVerificacion = cuerpo<VerificacionBody>(res);
      expect(cuerpoVerificacion.valido).toBe(true);
      expect(cuerpoVerificacion.modulos).toEqual(MODULOS);
      expect(res.text).not.toContain('María');
    });

    it('un código inexistente responde inválido, no un error', async () => {
      const res = await server()
        .get('/api/certificados/verificar/SW-0000-0000')
        .expect(200);

      expect(cuerpo<VerificacionBody>(res)).toEqual({ valido: false });
    });
  });
});
