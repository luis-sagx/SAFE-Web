import { createContext } from 'react'

// PanelVeredicto avisa por aquí cuando se llega al cierre del repaso; el
// layout usa eso para no advertir en "Salir" si ya no hay nada a medias.
export const ViewedReviewContext = createContext<((seen: boolean) => void) | null>(null)
