import { describe, expect, it } from 'vitest'
import {
  SCENARIOS,
  SECTIONS,
  getSectionScenarios,
  getScenario,
  getSection,
  getScenarioPath,
} from './catalogo'

// Mismo patrón que exige CreateRunDto: un id que no lo cumpla se juega igual y
// el POST /runs lo rechaza con 400, perdiendo la corrida en silencio.
const SCENARIO_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/

// Copia deliberada de THRESHOLDS del backend (apps/entrenamiento/src/runs/
// progreso.ts). El frontend no puede importarlo —son dos paquetes distintos— y
// tampoco debe: el servidor no expone el total de escenarios justamente para
// que un cliente modificado no pueda aprobarse falseando el denominador. Al
// duplicarlo aquí, si alguien mueve el umbral sin mover el catálogo, este test
// falla en vez de que el bug salga a producción.
const EXPECTED_THRESHOLDS: Record<string, number> = {
  phishing: 6,
  smishing: 6,
  vishing: 6,
  suplantacion: 6,
  estafa: 6,
  fisico: 6,
  'asistentes-ia': 3,
}

describe('catálogo de escenarios', () => {
  it('todos los ids cumplen el formato que exige el backend', () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.id, scenario.id).toMatch(SCENARIO_ID)
      expect(scenario.id).toBe(`${scenario.seccionId}/${scenario.escenarioId}`)
    }
  })

  it('no hay ids repetidos', () => {
    const ids = SCENARIOS.map((scenario) => scenario.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada escenario pertenece a una sección declarada', () => {
    const sections = new Set(SECTIONS.map((section) => section.id))
    for (const scenario of SCENARIOS) {
      expect(sections, scenario.id).toContain(scenario.seccionId)
    }
  })

  // `espeja` apunta al caso gemelo (fraude ↔ legítimo) del diseño pedagógico.
  it('las referencias de espejo apuntan a escenarios existentes', () => {
    for (const { id, espeja: mirrored } of SCENARIOS) {
      if (mirrored !== null) {
        expect(getScenario(mirrored), `${id} espeja ${mirrored}`).toBeDefined()
      }
    }
  })

  it('la versión es un entero >= 1, como exige el DTO', () => {
    for (const scenario of SCENARIOS) {
      expect(Number.isInteger(scenario.version), scenario.id).toBe(true)
      expect(scenario.version).toBeGreaterThanOrEqual(1)
    }
  })

  // El MVP empieza con phishing y suma smishing y vishing. Las otras secciones
  // se quedan declaradas pero sin escenarios, y Dashboard.tsx las marca
  // "Pronto". Es un estado deliberado, no un olvido. Riesgo físico se desbloqueó después.
  it('phishing, smishing, vishing, suplantación, estafa, riesgo físico y asistentes de IA son las secciones activas', () => {
    const active = SECTIONS.filter((section) => getSectionScenarios(section.id).length > 0)
    expect(active.map((section) => section.id)).toEqual([
      'phishing',
      'smishing',
      'vishing',
      'suplantacion',
      'estafa',
      'fisico',
      'asistentes-ia',
    ])
  })

  // La forma del módulo completo: 8 escenarios, 6 de fraude y 2 legítimos. Los
  // legítimos no son relleno — sin ellos el módulo enseñaría "desconfía de
  // todo" en vez de entrenar el criterio para distinguir.
  //
  // El 8 además es el denominador del gating: el backend exige 6 aprobados
  // (THRESHOLDS.phishing en apps/entrenamiento/src/runs/progreso.ts). Si este
  // total baja de 6, el módulo se vuelve imposible de aprobar y la barra de
  // progreso nunca llega al final; el test de abajo es el que avisa.
  it('phishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const phishing = getSectionScenarios('phishing')
    expect(phishing).toHaveLength(8)
    expect(phishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(phishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Misma forma que phishing, y por lo mismo (issue #72).
  it('smishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const smishing = getSectionScenarios('smishing')
    expect(smishing).toHaveLength(8)
    expect(smishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(smishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y vishing igual. Los dos legítimos pesan más aquí que en ningún otro
  // módulo: en una llamada la tentación es enseñar "cuelga siempre", y sin un
  // caso verdadero eso es lo único que quedaría aprendido.
  it('vishing tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const vishing = getSectionScenarios('vishing')
    expect(vishing).toHaveLength(8)
    expect(vishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(vishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y suplantación. Sus dos legítimos son de tipos distintos a propósito: uno
  // es el mismo mensaje de un fraude siendo verdad, y el otro pone al
  // participante del lado de quien está siendo suplantado.
  it('suplantación tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const impersonation = getSectionScenarios('suplantacion')
    expect(impersonation).toHaveLength(8)
    expect(impersonation.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(impersonation.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })

  // Y estafa electrónica. Sus dos legítimos espejan a los dos frentes del
  // módulo: una venta que sí se cierra y un arriendo que sí era.
  it('estafa tiene 8 escenarios: 6 de fraude y 2 legítimos', () => {
    const scam = getSectionScenarios('estafa')
    expect(scam).toHaveLength(8)
    expect(scam.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
    expect(scam.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
  })


  // La sección más chica del catálogo: no hay un tercero que engañe, así que
  // sus 4 escenarios son todos 'legitimo' (issue #162), y el umbral (3/4) es
  // el mismo 75% que exigen los módulos de 8.
  it('asistentes-ia tiene 4 escenarios, todos de criterio propio (sin espejo)', () => {
    const aiAssistants = getSectionScenarios('asistentes-ia')
    expect(aiAssistants).toHaveLength(4)
    expect(aiAssistants.every((e) => e.naturaleza === 'legitimo')).toBe(true)
  })

  // Guarda contra la regresión que tuvo la pantalla: el catálogo se redujo a 3
  // escenarios y el umbral del backend se quedó en 6, así que la insignia
  // mostraba "0/3 aprobados · necesitas 6" y aprobar era imposible.
  it('cada sección activa tiene escenarios suficientes para alcanzar su umbral', () => {
    for (const section of SECTIONS) {
      const total = getSectionScenarios(section.id).length
      if (total === 0) continue
      const required = EXPECTED_THRESHOLDS[section.id]
      expect(required, `falta el umbral esperado de ${section.id}`).toBeDefined()
      expect(
        total,
        `${section.id}: ${total} escenarios para un umbral de ${required}`,
      ).toBeGreaterThanOrEqual(required ?? 0)
    }
  })

  it('resuelve secciones y escenarios por id, y devuelve undefined si no existen', () => {
    expect(getSection('phishing')?.titulo).toBe('Phishing')
    expect(getSection(undefined)).toBeUndefined()
    expect(getScenario('phishing/no-existe')).toBeUndefined()
  })

  it('publica el pago del colegio en una ruta neutral sin cambiar su id histórico', () => {
    const scenario = getScenario('phishing/secuestro-hilo')

    expect(scenario?.id).toBe('phishing/secuestro-hilo')
    expect(scenario && getScenarioPath(scenario)).toBe(
      '/seccion/phishing/pago-pension-colegio',
    )
  })
})
