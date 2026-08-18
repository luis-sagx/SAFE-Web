import { seudonimo } from './seudonimo';

describe('seudonimo', () => {
  it('rellena con ceros para que ordene alfabéticamente igual que numéricamente', () => {
    expect(seudonimo(1)).toBe('P001');
    expect(seudonimo(42)).toBe('P042');
    expect([seudonimo(2), seudonimo(10)].sort()).toEqual(['P002', 'P010']);
  });

  it('no se corta cuando la muestra pasa de 999', () => {
    expect(seudonimo(1000)).toBe('P1000');
  });
});
