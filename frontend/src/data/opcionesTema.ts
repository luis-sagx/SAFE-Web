import { Moon, Sun } from 'lucide-react'
import type { Preference } from '../context/ThemeContext'

// Compartidas por SelectorTema (la lista) y MenuTema (el ícono del botón).
export const THEME_OPTIONS: { valor: Preference; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
]
