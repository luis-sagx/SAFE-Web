import { isValidElement, type ReactNode } from 'react'

function extraer(nodo: ReactNode): string {
  if (nodo === null || nodo === undefined || typeof nodo === 'boolean') {
    return ''
  }

  if (typeof nodo === 'string' || typeof nodo === 'number') {
    return String(nodo)
  }

  if (Array.isArray(nodo)) {
    return nodo.map(extraer).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(nodo)) {
    return extraer(nodo.props.children)
  }

  return ''
}

export function textoPlano(nodo: ReactNode): string {
  return extraer(nodo).replace(/\s+/g, ' ').trim()
}
