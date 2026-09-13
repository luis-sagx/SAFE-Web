import type { Signal } from '../components/ui/PanelVeredicto'

export function createSignal(
  id: string,
  screen: string,
  targetId: string,
  text: string,
): Signal {
  return { id, pantalla: screen, targetId, texto: text }
}
