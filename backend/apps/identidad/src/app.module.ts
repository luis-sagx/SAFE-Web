import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from '@comun';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CertificadosModule } from './certificados/certificados.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // El límite estricto del login se declara aparte, en su controlador.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // Sin esto, el 429 llega con el mensaje en inglés de la librería
      // ("ThrottlerException: Too Many Requests") directo hasta la pantalla.
      errorMessage:
        'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    CertificadosModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
