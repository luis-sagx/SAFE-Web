import { esCedulaEcuatoriana, huellaCedula, mismaHuella } from './cedula';

describe('esCedulaEcuatoriana', () => {
  // Cédulas construidas con el algoritmo, no de personas reales. La última
  // usa la provincia 30 (ecuatorianos registrados en el exterior).
  it.each(['1710034065', '0926687856', '1104535438', '3012345678'])(
    'acepta %s',
    (cedula) => {
      expect(esCedulaEcuatoriana(cedula)).toBe(true);
    },
  );

  // Cada una tiene el verificador CORRECTO: lo que se rechaza es la otra
  // regla, no un dígito mal puesto. Si no, la prueba pasaría por el motivo
  // equivocado.
  it.each([
    ['dígito verificador incorrecto', '1710034066'],
    ['provincia 00', '0010034064'],
    ['provincia 25, que no existe', '2510034065'],
    ['provincia 31, fuera de rango', '3110034067'],
    ['tercer dígito 6: no es persona natural', '1760034064'],
    ['nueve dígitos', '171003406'],
    ['once dígitos', '17100340651'],
    ['con letras', '17100340a5'],
    ['vacía', ''],
  ])('rechaza %s', (_caso, cedula) => {
    expect(esCedulaEcuatoriana(cedula)).toBe(false);
  });

  it.each([null, undefined, 1710034065, {}, []])(
    'rechaza el valor no textual %p sin lanzar',
    (valor) => {
      expect(esCedulaEcuatoriana(valor)).toBe(false);
    },
  );
});

describe('huellaCedula', () => {
  // Determinista: es lo que le permite servir de índice único.
  it('da la misma huella para la misma cédula y el mismo pepper', () => {
    expect(huellaCedula('1710034065', 'pepper-1')).toBe(
      huellaCedula('1710034065', 'pepper-1'),
    );
  });

  it('da huellas distintas para cédulas distintas', () => {
    expect(huellaCedula('1710034065', 'pepper-1')).not.toBe(
      huellaCedula('0926687856', 'pepper-1'),
    );
  });

  // Esto es lo que hace que destruir el pepper anonimice de verdad: sin él,
  // ninguna huella vieja se puede reproducir.
  it('cambia por completo si cambia el pepper', () => {
    expect(huellaCedula('1710034065', 'pepper-1')).not.toBe(
      huellaCedula('1710034065', 'pepper-2'),
    );
  });

  it('nunca contiene la cédula en claro', () => {
    expect(huellaCedula('1710034065', 'pepper-1')).not.toContain('1710034065');
  });

  it('compara huellas en tiempo constante', () => {
    const uno = huellaCedula('1710034065', 'pepper-1');
    const otro = huellaCedula('0926687856', 'pepper-1');

    expect(mismaHuella(uno, uno)).toBe(true);
    expect(mismaHuella(uno, otro)).toBe(false);
  });
});
