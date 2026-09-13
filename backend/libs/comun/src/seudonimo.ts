// Se deriva de `seq` (llega en el JWT) en vez de guardarse, y el participante nunca la ve.
export function pseudonym(seq: number): string {
  return `P${String(seq).padStart(3, '0')}`;
}
