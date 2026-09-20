import { AuthModule } from './auth.module';

// Nada de lógica que probar (solo metadata de Nest): esto existe para que
// el archivo se importe al menos una vez fuera de los e2e (que no cuentan
// para la cobertura de Sonar, ver .github/workflows/ci.yml).
describe('AuthModule', () => {
  it('se puede importar', () => {
    expect(AuthModule).toBeDefined();
  });
});
