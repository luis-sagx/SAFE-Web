import { pseudonym } from './seudonimo';

describe('seudonimo', () => {
  it('rellena con ceros para que ordene alfabéticamente igual que numéricamente', () => {
    expect(pseudonym(1)).toBe('P001');
    expect(pseudonym(42)).toBe('P042');
    expect([pseudonym(2), pseudonym(10)].sort()).toEqual(['P002', 'P010']);
  });

  it('no se corta cuando la muestra pasa de 999', () => {
    expect(pseudonym(1000)).toBe('P1000');
  });
});
