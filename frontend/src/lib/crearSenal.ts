import type { Senal } from '../components/ui/PanelVeredicto'

export function crearSenal(
  id: string,
  pantalla: string,
  targetId: string,
  texto: string,
): Senal {
  return { id, pantalla, targetId, texto }
}
