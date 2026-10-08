import { createContext } from 'react'

export const SceneRatioContext = createContext<((ratio: number) => void) | null>(null)
