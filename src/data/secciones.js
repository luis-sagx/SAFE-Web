export const SECCIONES = [
  {
    id: 'phishing',
    titulo: 'Phishing bancario',
    tag: 'Banca / Ingeniería social',
    estado: 'disponible',
    escenarios: [
      {
        id: 'saldo-contable',
        titulo: 'Saldo contable',
        descripcion:
          'Venta en línea, comprobante enviado y presión para entregar antes de confirmar fondos.',
      },
    ],
  },
  {
    id: 'smishing',
    titulo: 'Smishing',
    tag: 'Mensajería / Suplantación',
    estado: 'disponible',
    escenarios: [
      {
        id: 'cambio-numero',
        titulo: 'Cambio de número',
        descripcion:
          'Un contacto conocido escribe desde otro número y trata de acelerar una transferencia.',
      },
    ],
  },
  {
    id: 'vishing',
    titulo: 'Vishing',
    tag: 'Vishing / Presión',
    estado: 'disponible',
    escenarios: [
      {
        id: 'llamada-antiestafas',
        titulo: 'Llamada antiestafas',
        descripcion:
          'Una llamada urgente busca que tomes decisiones bajo presión y sin verificación suficiente.',
      },
    ],
  },
  {
    id: 'fisico',
    titulo: 'Riesgo físico',
    tag: 'Exposición física / Oficina',
    estado: 'disponible',
    escenarios: [
      {
        id: 'foto',
        titulo: 'Foto para el boletín',
        descripcion: 'Una escena cotidiana expone información sensible visible en el puesto de trabajo.',
      },
      {
        id: 'baiting',
        titulo: 'Trampa USB',
        descripcion:
          'Debes identificar señales de riesgo físico y digital antes de conectar un dispositivo desconocido.',
      },
    ],
  },
  {
    id: 'quishing',
    titulo: 'Quishing',
    tag: 'Códigos QR maliciosos',
    estado: 'proximamente',
    escenarios: [],
  },
  {
    id: 'deepfake',
    titulo: 'Deepfake',
    tag: 'Audio / video sintético',
    estado: 'proximamente',
    escenarios: [],
  },
]

export function getSeccion(seccionId) {
  return SECCIONES.find((seccion) => seccion.id === seccionId)
}

export function getEscenario(seccionId, escenarioId) {
  return getSeccion(seccionId)?.escenarios.find((escenario) => escenario.id === escenarioId)
}
