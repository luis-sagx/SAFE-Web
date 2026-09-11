import { createContext } from 'react'

/**
 * EscenarioLayout lo provee alrededor del bloque de decisión; PanelVeredicto
 * avisa por aquí cuando el participante llega al cierre del repaso —o de una
 * vez, cuando el desenlace no trae señales que ver—.
 *
 * El layout lo usa para el diálogo de "Salir": con el escenario terminado y
 * sin señales pendientes, salir ya no borra nada ni deja nada a medias, así
 * que no necesita advertencia ni confirmación.
 */
export const RepasoVistoContext = createContext<((visto: boolean) => void) | null>(null)
