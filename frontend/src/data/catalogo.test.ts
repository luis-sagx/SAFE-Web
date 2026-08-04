import { describe, expect, it } from 'vitest'
import { ESCENARIOS, SECCIONES, escenariosDeSeccion, getEscenario, getSeccion } from './catalogo'

// Mismo patrón que exige CreateRunDto: un id que no lo cumpla se juega igual y
// el POST /runs lo rechaza con 400, perdiendo la corrida en silencio.
const SCENARIO_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/

describe('catálogo de escenarios', () => {
  it('todos los ids cumplen el formato que exige el backend', () => {
    for (const escenario of ESCENARIOS) {
      expect(escenario.id, escenario.id).toMatch(SCENARIO_ID)
      expect(escenario.id).toBe(`${escenario.seccionId}/${escenario.escenarioId}`)
    }
  })

  it('no hay ids repetidos', () => {
    const ids = ESCENARIOS.map((escenario) => escenario.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada escenario pertenece a una sección declarada', () => {
    const secciones = new Set(SECCIONES.map((seccion) => seccion.id))
    for (const escenario of ESCENARIOS) {
      expect(secciones, escenario.id).toContain(escenario.seccionId)
    }
  })

  // `espeja` apunta al caso gemelo (fraude ↔ legítimo) del diseño pedagógico.
  it('las referencias de espejo apuntan a escenarios existentes', () => {
    for (const { id, espeja } of ESCENARIOS) {
      if (espeja !== null) {
        expect(getEscenario(espeja), `${id} espeja ${espeja}`).toBeDefined()
      }
    }
  })

  it('la versión es un entero >= 1, como exige el DTO', () => {
    for (const escenario of ESCENARIOS) {
      expect(Number.isInteger(escenario.version), escenario.id).toBe(true)
      expect(escenario.version).toBeGreaterThanOrEqual(1)
    }
  })

  // El MVP es solo phishing (ver spec 2026-08-03): las otras cinco secciones
  // se quedan declaradas pero sin escenarios, y Dashboard.tsx las marca
  // "Pronto". Es un estado deliberado, no un olvido.
  it('phishing es la única sección con escenarios activos en el MVP', () => {
    const activas = SECCIONES.filter((seccion) => escenariosDeSeccion(seccion.id).length > 0)
    expect(activas.map((seccion) => seccion.id)).toEqual(['phishing'])
  })

  // Sube a 8 (6 fraude + 2 legítimos) cuando la fase siguiente agregue los 5
  // escenarios que faltan; hasta entonces este es el piso del MVP: al menos un
  // caso legítimo por cada fraude, para que el criterio se entrene desde ya y
  // no se convierta en una lista de estafas.
  it('phishing tiene 3 escenarios: 2 de fraude y 1 legítimo', () => {
    const phishing = escenariosDeSeccion('phishing')
    expect(phishing).toHaveLength(3)
    expect(phishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(2)
    expect(phishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(1)
  })

  it('resuelve secciones y escenarios por id, y devuelve undefined si no existen', () => {
    expect(getSeccion('phishing')?.titulo).toBe('Phishing')
    expect(getSeccion(undefined)).toBeUndefined()
    expect(getEscenario('phishing/no-existe')).toBeUndefined()
  })
})
