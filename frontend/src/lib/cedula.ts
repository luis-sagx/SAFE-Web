// Copia deliberada de backend/apps/identidad/src/cedula/cedula.ts (proyectos
// independientes); el backend valida igual, esto es solo comodidad para el formulario.

const COEFICIENTES = [2, 1, 2, 1, 2, 1, 2, 1, 2]

// Quita espacios, puntos y guiones. Hay quien la escribe "171003406-5".
export function normalizarCedula(valor: string): string {
  return valor.replace(/[\s.-]/g, '')
}

export function esCedulaEcuatoriana(valor: string): boolean {
  const cedula = normalizarCedula(valor)

  if (!/^[0-9]{10}$/.test(cedula)) {
    return false
  }

  // slice en vez de índice: con `noUncheckedIndexedAccess` el acceso por índice sería `number | undefined`.
  const digito = (i: number) => Number(cedula.slice(i, i + 1))

  // Provincia: 01–24, más 30 para ecuatorianos registrados en el exterior.
  const provincia = Number(cedula.slice(0, 2))
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false
  }

  // Tercer dígito < 6 identifica a una persona natural.
  if (digito(2) >= 6) {
    return false
  }

  const suma = COEFICIENTES.reduce((total, coeficiente, i) => {
    const producto = digito(i) * coeficiente
    // Un producto de dos cifras se reduce restando 9.
    return total + (producto >= 10 ? producto - 9 : producto)
  }, 0)

  return (10 - (suma % 10)) % 10 === digito(9)
}
