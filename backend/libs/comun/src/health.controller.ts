import { Controller, Get } from '@nestjs/common';

/// Health check de cada servicio. Lo usan el HEALTHCHECK de Docker y el
/// pipeline de CI. Nginx expone el de `identidad` en /api/health.
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
