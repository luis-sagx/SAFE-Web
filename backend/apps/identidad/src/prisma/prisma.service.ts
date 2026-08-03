import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/identidad/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 exige un driver adapter: la URL ya no se lee del schema.
    //
    // El schema va como segundo argumento y no como `?schema=` en la URL: el
    // CLI de Prisma sí honra ese parámetro, pero el driver adapter NO — se
    // queda en `public` y toda consulta falla con "permission denied for
    // schema public", porque el rol de este servicio no tiene permiso ahí.
    super({
      adapter: new PrismaPg(
        { connectionString: process.env.IDENTIDAD_DATABASE_URL },
        { schema: 'identidad' },
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
