/**
 * Identificación del participante en el análisis. Se deriva de `seq` —que
 * llega en el JWT— en vez de guardarse, y el participante nunca la ve.
 */
export function seudonimo(seq: number): string {
  return `P${String(seq).padStart(3, '0')}`;
}
