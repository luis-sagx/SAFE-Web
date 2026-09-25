import type { Context } from '../components/ui/ContextoEscenario'
import { textoPlano } from './textoPlano'

// Misma frase de EscenarioLayout.tsx: es fija en las 53 escenarios, así que
// entra tal cual en el audio en vez de duplicarla ahí y aquí por separado.
export const MISION_TEXTO = 'Tu misión: decide qué haces con esto y por qué.'

export function textoNarracion(contexto: Context): string {
  return [textoPlano(contexto.antes), textoPlano(contexto.ahora), MISION_TEXTO].join(' ')
}
