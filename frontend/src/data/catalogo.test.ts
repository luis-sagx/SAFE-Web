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
  smishing: 6,
  vishing: 6,
  suplantacion: 6,
  estafa: 6,
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

  // El MVP empieza con phishing y suma smishing y vishing. Las otras secciones
  // se quedan declaradas pero sin escenarios, y Dashboard.tsx las marca
  // "Pronto". Es un estado deliberado, no un olvido.
  it('phishing, smishing, vishing, suplantación y estafa son las secciones activas', () => {
    const activas = SECCIONES.filter((seccion) => escenariosDeSeccion(seccion.id).length > 0)
    expect(activas.map((seccion) => seccion.id)).toEqual([
      'phishing',
      'smishing',
      'vishing',
      'suplantacion',
      'estafa',
    ])
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

  // Misma forma que phishing, y por lo mismo (issue #72).
  it('smishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const smishing = escenariosDeSeccion('smishing')
    expect(smishing).toHaveLength(8)
    expect(smishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(smishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y vishing igual. Los dos legítimos pesan más aquí que en ningún otro
  // módulo: en una llamada la tentación es enseñar "cuelga siempre", y sin un
  // caso verdadero eso es lo único que quedaría aprendido.
  it('vishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const vishing = escenariosDeSeccion('vishing')
    expect(vishing).toHaveLength(8)
    expect(vishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(vishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y suplantación. Sus dos legítimos son de tipos distintos a propósito: uno
  // es el mismo mensaje de un fraude siendo verdad, y el otro pone al
  // participante del lado de quien está siendo suplantado.
  it('suplantación tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const suplantacion = escenariosDeSeccion('suplantacion')
    expect(suplantacion).toHaveLength(8)
    expect(suplantacion.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(suplantacion.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y estafa electrónica. Sus dos legítimos espejan a los dos frentes del
  // módulo: una venta que sí se cierra y un arriendo que sí era.
  it('estafa tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const estafa = escenariosDeSeccion('estafa')
    expect(estafa).toHaveLength(8)
    expect(estafa.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(estafa.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
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
