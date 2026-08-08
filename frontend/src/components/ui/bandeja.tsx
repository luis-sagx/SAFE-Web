/**
 * Los otros correos de la bandeja.
 *
 * El phishing nunca llega a un buzón vacío: llega entre el recibo de la luz y
 * un boletín que nadie lee, con prisa y sin mirar mucho. Un cliente con un solo
 * mensaje —el que hay que juzgar— avisa por sí solo de que ese es el
 * sospechoso, que es justo la ayuda que el ejercicio no debería dar.
 *
 * Son los mismos en los ocho escenarios: es el mismo buzón de la misma persona,
 * y reconocerlo de un escenario a otro ahorra tener que orientarse cada vez.
 *
 * Escritos a propósito para ser aburridos. Ni tan interesantes que se lean en
 * lugar del mensaje del ejercicio, ni con nada que parezca una segunda trampa:
 * un relleno sospechoso convertiría el escenario en otra cosa.
 */

export interface CorreoBandeja {
  id: string
  nombre: string
  direccion: string
  asunto: string
  hora: string
  /** Un párrafo. No hay enlaces ni adjuntos: nada que invite a decidir. */
  cuerpo: string
}

export const OTROS_CORREOS: CorreoBandeja[] = [
  {
    id: 'luz',
    nombre: 'Empresa Eléctrica',
    direccion: 'facturacion@electrica-servicio.ec',
    asunto: 'Tu planilla de agosto ya está disponible',
    hora: 'ayer 18:40',
    cuerpo:
      'El valor de este mes es de $23,80 y vence el 20 de agosto. Puedes revisarla en tu cuenta o en cualquier punto de recaudación autorizado.',
  },
  {
    id: 'cita',
    nombre: 'Centro Médico Los Álamos',
    direccion: 'recordatorios@centrolosalamos.ec',
    asunto: 'Recordatorio: control el jueves 13 a las 10:30',
    hora: 'ayer 09:12',
    cuerpo:
      'Te esperamos el jueves 13 a las 10:30 con el doctor Herrera. Si no puedes asistir, avísanos con un día de anticipación al 02 244 9080.',
  },
  {
    id: 'boletin',
    nombre: 'Biblioteca Municipal',
    direccion: 'boletin@bibliotecamunicipal.ec',
    asunto: 'Talleres de agosto: lectura, memoria y computación básica',
    hora: 'lun 07:55',
    cuerpo:
      'Este mes abrimos tres talleres gratuitos para adultos mayores. Los cupos son limitados y la inscripción se hace en la recepción de la biblioteca.',
  },
]
