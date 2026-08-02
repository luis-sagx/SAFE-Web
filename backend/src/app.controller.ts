import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /// Health check que usan el healthcheck de Docker y el pipeline de CI.
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
