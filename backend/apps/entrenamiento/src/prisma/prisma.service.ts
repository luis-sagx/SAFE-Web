import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/entrenamiento/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 exige un driver adapter: la URL ya no se lee del schema.
    //
    // Esta conexión usa el rol `entrenamiento`, que no tiene permiso sobre el
    // schema `identidad`. Es lo que hace que la exportación del estudio no
    // pueda filtrar un dato personal ni con SQL crudo.
    //
    // El schema va como segundo argumento y no como `?schema=` en la URL: el
    // driver adapter no honra ese parámetro y se quedaría en `public`.
    super({
      adapter: new PrismaPg(
        { connectionString: process.env.ENTRENAMIENTO_DATABASE_URL },
        { schema: 'entrenamiento' },
      ),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
