import { describe, expect, it } from 'vitest'
import { esCedulaEcuatoriana } from './cedula'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from './identidadFicticia'

describe('identidad ficticia de los escenarios', () => {
  // El único test que de verdad importa aquí. La cédula se enseña en pantalla y
  // viaja en los textos de los finales: si algún día alguien la cambia por una
  // válida, estaría publicando la de una persona real (ver issue #7).
  it('la cédula no puede pertenecerle a nadie', () => {
    expect(esCedulaEcuatoriana(IDENTIDAD_FICTICIA.cedula)).toBe(false)
  })

  it('el RUC se deriva de esa misma cédula', () => {
    expect(IDENTIDAD_FICTICIA.ruc).toBe(`${IDENTIDAD_FICTICIA.cedula}001`)
  })

  // La contraseña se enseña en pantalla. Si alguien la cambia por algo corto o
  // plausible, deja de ser la del ejercicio y empieza a parecerse a una real.
  it('la contraseña se reconoce como del ejercicio', () => {
    expect(IDENTIDAD_FICTICIA.clave).toMatch(/practica/i)
    expect(IDENTIDAD_FICTICIA.clave.length).toBeGreaterThan(15)
  })

  it('la cuenta se lee con su banco', () => {
    expect(CUENTA_FICTICIA).toContain(IDENTIDAD_FICTICIA.cuenta)
    expect(CUENTA_FICTICIA).toContain(IDENTIDAD_FICTICIA.banco)
  })
})
