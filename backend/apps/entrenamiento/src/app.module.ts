import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from '@comun';
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
    PrismaModule,
    RunsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
