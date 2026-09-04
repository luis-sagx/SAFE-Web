import { CertificadosModule } from './certificados.module';

// Nada de lógica que probar aquí; solo que el módulo se importa sin
// reventar — atrapa un typo en el decorador o un ciclo de imports antes de
// que lo haga el arranque real del servicio.
describe('CertificadosModule', () => {
  it('se puede importar', () => {
    expect(CertificadosModule).toBeDefined();
  });
});
