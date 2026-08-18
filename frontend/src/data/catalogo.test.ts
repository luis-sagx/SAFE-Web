import { describe, expect, it } from 'vitest'
import { ESCENARIOS, SECCIONES, escenariosDeSeccion, getEscenario, getSeccion } from './catalogo'

// Mismo patrón que exige CreateRunDto: un id que no lo cumpla se juega igual y
// el POST /runs lo rechaza con 400, perdiendo la corrida en silencio.
const SCENARIO_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/

// Copia deliberada de UMBRALES del backend (apps/entrenamiento/src/runs/
// progreso.ts). El frontend no puede importarlo —son dos paquetes distintos— y
// tampoco debe: el servidor no expone el total de escenarios justamente para
// que un cliente modificado no pueda aprobarse falseando el denominador. Al
// duplicarlo aquí, si alguien mueve el umbral sin mover el catálogo, este test
// falla en vez de que el bug salga a producción.
const UMBRALES_ESPERADOS: Record<string, number> = {
  phishing: 6,
  smishing: 3,
}

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

  // El MVP empieza con phishing y suma smishing como segundo módulo activo. Las
  // otras secciones se quedan declaradas pero sin escenarios, y Dashboard.tsx
  // las marca "Pronto". Es un estado deliberado, no un olvido.
  it('phishing y smishing son las únicas secciones con escenarios activos', () => {
    const activas = SECCIONES.filter((seccion) => escenariosDeSeccion(seccion.id).length > 0)
    expect(activas.map((seccion) => seccion.id)).toEqual(['phishing', 'smishing'])
  })

  // La forma del módulo completo: 8 escenarios, 6 de fraude y 2 legítimos. Los
  // legítimos no son relleno — sin ellos el módulo enseñaría "desconfía de
  // todo" en vez de entrenar el criterio para distinguir.
  //
  // El 8 además es el denominador del gating: el backend exige 6 aprobados
  // (UMBRALES.phishing en apps/entrenamiento/src/runs/progreso.ts). Si este
  // total baja de 6, el módulo se vuelve imposible de aprobar y la barra de
  // progreso nunca llega al final; el test de abajo es el que avisa.
  it('phishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const phishing = escenariosDeSeccion('phishing')
    expect(phishing).toHaveLength(8)
    expect(phishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(phishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Smishing va camino de los mismos 8 = 6 + 2 (issue #72). Mientras se
  // completa, el test acompaña la cuenta real en vez de fijarla: lo que no
  // puede pasar es que crezca sin que nadie repase la proporción.
  it('smishing va sumando escenarios, con más fraude que legítimos', () => {
    const smishing = escenariosDeSeccion('smishing')
    expect(smishing).toHaveLength(6)
    expect(smishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(5)
    expect(smishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(1)
  })

  // Guarda contra la regresión que tuvo la pantalla: el catálogo se redujo a 3
  // escenarios y el umbral del backend se quedó en 6, así que la insignia
  // mostraba "0/3 aprobados · necesitas 6" y aprobar era imposible.
  it('cada sección activa tiene escenarios suficientes para alcanzar su umbral', () => {
    for (const seccion of SECCIONES) {
      const total = escenariosDeSeccion(seccion.id).length
      if (total === 0) continue
      const requeridos = UMBRALES_ESPERADOS[seccion.id]
      expect(requeridos, `falta el umbral esperado de ${seccion.id}`).toBeDefined()
      expect(
        total,
        `${seccion.id}: ${total} escenarios para un umbral de ${requeridos}`,
      ).toBeGreaterThanOrEqual(requeridos ?? 0)
    }
  })

  it('resuelve secciones y escenarios por id, y devuelve undefined si no existen', () => {
    expect(getSeccion('phishing')?.titulo).toBe('Phishing')
    expect(getSeccion(undefined)).toBeUndefined()
    expect(getEscenario('phishing/no-existe')).toBeUndefined()
  })
})
