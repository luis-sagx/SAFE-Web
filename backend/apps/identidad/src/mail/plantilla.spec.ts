import { emailLayout } from './plantilla';

describe('emailLayout', () => {
  it('envuelve el cuerpo con el título visible y la paleta de la app', () => {
    const html = emailLayout('Confirma tu correo', '<p>Hola, Ana.</p>');

    expect(html).toContain('<p>Hola, Ana.</p>');
    expect(html).toContain('Confirma tu correo');
    // Paleta de docs/DESIGN.md, no la del PDF del certificado.
    expect(html).toContain('#006837');
    // CSS inline, nunca <style> en <head>: varios clientes de correo lo recortan.
    expect(html).not.toContain('<style');
  });

  it('no revienta con HTML que ya trae etiquetas propias en el cuerpo', () => {
    const html = emailLayout('Título', '<p>Con <a href="https://x.com">un link</a> adentro.</p>');

    expect(html).toContain('<a href="https://x.com">un link</a>');
  });
});
