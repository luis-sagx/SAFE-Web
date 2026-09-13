import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AttestationPayload, JwtPayload } from '@comun';
import { PrismaService } from '../apps/identidad/src/prisma/prisma.service';
import {
  createTestApp,
  responseBody,
  cleanDatabase,
  registrationData,
  type SessionBody,
} from './identidad.e2e';

interface CertificateBody {
  codigo: string;
  emitidoAt: string;
  modulos: string[];
  horas: number;
}

interface VerificationBody {
  valido: boolean;
  emitidoAt?: string;
  horas?: number;
  modulos?: string[];
}

const MODULES = [
  'phishing',
  'smishing',
  'vishing',
  'suplantacion',
  'estafa',
  'fisico',
];

describe('Certificados (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const server = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    jwt = app.get(JwtService);
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  /// `identidad` nunca calcula el progreso: la atestación es lo único que
  /// `entrenamiento` firmaría en producción, y aquí se firma igual, con el
  /// mismo `JwtService` que ya comparten los dos servicios.
  function attestation(payload: Partial<AttestationPayload>): Promise<string> {
    return jwt.signAsync({
      sub: 'sin-usar',
      seq: 0,
      modulos: MODULES,
      calificacion: 36,
      typ: 'atestacion',
      ...payload,
    } satisfies AttestationPayload);
  }

  /// Registra un participante real y decodifica su propio access token para
  /// sacarle `sub`/`seq`: el perfil que devuelve `/auth/register` nunca trae
  /// `seq` (el participante no debe verlo), así que es el único lugar de
  /// donde tomarlo sin tocar la base a mano.
  async function participant(suffix: string) {
    const res = await server()
      .post('/api/auth/register')
      .send(registrationData(suffix))
      .expect(201);
    const session = responseBody<SessionBody>(res);
    const payload = jwt.decode<JwtPayload>(session.accessToken);
    return {
      accessToken: session.accessToken,
      sub: payload.sub,
      seq: payload.seq,
    };
  }

  describe('POST /api/certificados', () => {
    it('exige token de acceso', async () => {
      const pase = await attestation({});
      await server()
        .post('/api/certificados')
        .send({ atestacion: pase })
        .expect(401);
    });

    it('rechaza un cuerpo sin la forma de un JWT antes de tocar el servicio', async () => {
      const { accessToken } = await participant('cert-1');
      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: 'esto-no-tiene-puntos' })
        .expect(400);
    });

    it('rechaza una atestación con la forma de un JWT pero mal firmada', async () => {
      const { accessToken } = await participant('cert-1b');
      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: 'aaa.bbb.ccc' })
        .expect(403);
    });

    it('rechaza un access token presentado como si fuera la atestación', async () => {
      const { accessToken } = await participant('cert-2');
      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: accessToken })
        .expect(403);
    });

    // La comprobación que sostiene todo el flujo: sin ella, la atestación de
    // otra persona serviría para emitirse un certificado con su progreso.
    it('rechaza una atestación de un participante distinto al que la presenta', async () => {
      const { accessToken } = await participant('cert-3');
      const otherToken = await attestation({
        sub: 'otro-participante',
        seq: 999,
      });

      await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: otherToken })
        .expect(403);
    });

    it('emite el certificado y el mismo código al pedirlo dos veces', async () => {
      const { accessToken, sub, seq } = await participant('cert-4');
      const pase = await attestation({ sub, seq });

      const first = await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(201);

      const firstCertificate = responseBody<CertificateBody>(first);
      expect(firstCertificate.codigo).toMatch(/^SW-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(firstCertificate.horas).toBe(4);
      expect(firstCertificate.modulos).toEqual(MODULES);

      const secondResponse = await server()
        .post('/api/certificados')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(201);

      expect(responseBody<CertificateBody>(secondResponse).codigo).toBe(
        firstCertificate.codigo,
      );
    });
  });

  describe('POST /api/certificados/pdf', () => {
    it('devuelve el PDF de un certificado ya emitido', async () => {
      const { accessToken, sub, seq } = await participant('cert-5');
      const pase = await attestation({ sub, seq });

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
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect((res.body as Buffer).subarray(0, 5).toString('latin1')).toBe(
        '%PDF-',
      );
    });

    it('sin certificado emitido, 404', async () => {
      const { accessToken, sub, seq } = await participant('cert-6');
      const pase = await attestation({ sub, seq });

      await server()
        .post('/api/certificados/pdf')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ atestacion: pase })
        .expect(404);
    });
  });

  describe('GET /api/certificados/verificar/:codigo', () => {
    it('no exige sesión y no revela nombre alguno', async () => {
      const { accessToken, sub, seq } = await participant('cert-7');
      const pase = await attestation({ sub, seq });
      const issuedCertificate = responseBody<CertificateBody>(
        await server()
          .post('/api/certificados')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ atestacion: pase })
          .expect(201),
      );

      const res = await server()
        .get(`/api/certificados/verificar/${issuedCertificate.codigo}`)
        .expect(200);

      const verificationBody = responseBody<VerificationBody>(res);
      expect(verificationBody.valido).toBe(true);
      expect(verificationBody.modulos).toEqual(MODULES);
      expect(res.text).not.toContain('María');
    });

    it('un código inexistente responde inválido, no un error', async () => {
      const res = await server()
        .get('/api/certificados/verificar/SW-0000-0000')
        .expect(200);

      expect(responseBody<VerificationBody>(res)).toEqual({ valido: false });
    });
  });
});
