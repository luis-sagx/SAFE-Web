// Copia deliberada de backend/apps/identidad/src/cedula/cedula.ts (proyectos
// independientes); el backend valida igual, esto es solo comodidad para el formulario.

const COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2]

// Quita espacios, puntos y guiones. Hay quien la escribe "171003406-5".
export function normalizeEcuadorianId(value: string): string {
  return value.replace(/[\s.-]/g, '')
}

export function isEcuadorianId(value: string): boolean {
  const ecuadorianId = normalizeEcuadorianId(value)

  if (!/^[0-9]{10}$/.test(ecuadorianId)) {
    return false
  }

  // slice en vez de índice: con `noUncheckedIndexedAccess` el acceso por índice sería `number | undefined`.
  const digit = (i: number) => Number(ecuadorianId.slice(i, i + 1))

  // Provincia: 01–24, más 30 para ecuatorianos registrados en el exterior.
  const province = Number(ecuadorianId.slice(0, 2))
  if ((province < 1 || province > 24) && province !== 30) {
    return false
  }

  // Tercer dígito < 6 identifica a una persona natural.
  if (digit(2) >= 6) {
    return false
  }

  const sum = COEFFICIENTS.reduce((total, coefficient, i) => {
    const product = digit(i) * coefficient
    // Un producto de dos cifras se reduce restando 9.
    return total + (product >= 10 ? product - 9 : product)
  }, 0)

  return (10 - (sum % 10)) % 10 === digit(9)
}
