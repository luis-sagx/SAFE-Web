import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  AuthJwtModule,
  HealthController,
  ParticipantThrottlerGuard,
} from '@comun';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificados/certificados.module';
import { NarracionModule } from './narracion/narracion.module';
import { PrismaModule } from './prisma/prisma.module';
import { assertPiiEncryptionKey } from './pii/pii';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        assertPiiEncryptionKey(config.PII_ENCRYPTION_KEY);
        return config;
      },
    }),
    // 120/min por participante (por IP si no hay sesión). Los límites
    // estrictos de login y registro se declaran aparte, en su controlador.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // Sin esto, el 429 llega con el mensaje en inglés de la librería
      // ("ThrottlerException: Too Many Requests") directo hasta la pantalla.
      errorMessage:
        'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    }),
    // Lo necesita ParticipantThrottlerGuard para verificar el token.
    AuthJwtModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    CertificatesModule,
    NarracionModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ParticipantThrottlerGuard }],
})
export class AppModule {}
