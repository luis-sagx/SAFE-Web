import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  AuthJwtModule,
  HealthController,
  ParticipantThrottlerGuard,
} from '@comun';
import { PrismaModule } from './prisma/prisma.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    RunsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ParticipantThrottlerGuard }],
})
export class AppModule {}
