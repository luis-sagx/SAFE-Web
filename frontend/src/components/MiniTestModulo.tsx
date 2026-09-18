import { useState } from 'react'
import Ticket from './Boleto'
import { TRAMA_FONDO } from './TramaFondo'

interface Question {
  pregunta: string
  opciones: string[]
  correcta: number
  explicacion: string
}

// Dos preguntas por módulo, sobre el tipo de engaño específico que ese
// módulo enseña (issue #230): a diferencia del veredicto de cada escenario
// (que explica sus propias señales puntuales), esto pide recordar el
// criterio general del módulo completo una vez terminado.
const PREGUNTAS_POR_MODULO: Record<string, Question[]> = {
  phishing: [
    {
      pregunta: '¿Qué manda de verdad en una dirección web sospechosa?',
      opciones: [
        'El nombre que está justo antes de la primera barra (/)',
        'El nombre del banco, si aparece en cualquier parte del texto',
        'Que la página se vea idéntica a la oficial',
        'Que el enlace empiece con https://',
      ],
      correcta: 0,
      explicacion: 'Todo lo que va antes de esa barra puede escribirlo el atacante, incluido el nombre de tu banco.',
    },
    {
      pregunta: 'Te llega un correo urgente pidiendo confirmar tu clave con un enlace. ¿Qué haces?',
      opciones: [
        'Respondo el correo preguntando si es real',
        'Entro directo por mi app o el sitio oficial, sin usar ese enlace',
        'Hago clic rápido antes de que expire',
        'Reenvío el correo a un compañero para que decida',
      ],
      correcta: 1,
      explicacion: 'Entrar por tu propio camino, no por el enlace que te dieron, es lo que no depende de confiar en quien escribió el correo.',
    },
  ],
  smishing: [
    {
      pregunta: "Te llega un SMS de 'tu banco' con un enlace para verificar un cobro. ¿Qué es lo más seguro?",
      opciones: [
        'Tocar el enlace para ver de qué cobro se trata',
        "Responder 'STOP' al número",
        'Abrir la app oficial del banco por mi cuenta, no el enlace del SMS',
        'Reenviarlo a otro número para confirmar',
      ],
      correcta: 2,
      explicacion: 'La app oficial ya tiene tus movimientos reales; el enlace del SMS no hace falta para nada.',
    },
    {
      pregunta: '¿Cuál de estas es más probable que sea smishing?',
      opciones: [
        'Un mensaje de una app que ya tienes instalada, con tu nombre completo',
        'Un SMS de un número desconocido con un enlace acortado y mucha urgencia',
        'Un mensaje que llega a la misma hora que uno real',
        'Un mensaje sin faltas de ortografía',
      ],
      correcta: 1,
      explicacion: 'Número desconocido + enlace acortado + prisa es justo la combinación que usa el smishing.',
    },
  ],
  vishing: [
    {
      pregunta: 'En una llamada, alguien dice ser del banco y te pide el código que te llegó por SMS. ¿Qué haces?',
      opciones: [
        'Se lo dicto si me convence con datos reales',
        'Cuelgo y llamo al mismo número que me llamó',
        'Se lo doy si suena apurado de verdad',
        'No lo doy: ese código es solo mío, ni el banco lo necesita',
      ],
      correcta: 3,
      explicacion: 'Un código de un solo uso es la última puerta; ningún banco lo necesita para nada por teléfono.',
    },
    {
      pregunta: '¿Qué hace confiable de verdad una llamada que dice ser de tu banco?',
      opciones: [
        'Que tenga tu nombre y número de cuenta',
        'Que llame desde un número que reconoces',
        'Que la verifiques tú mismo llamando al número oficial que ya conocías',
        'Que no te pida nada raro al inicio',
      ],
      correcta: 2,
      explicacion: 'Verificar por tu propio canal es lo único que no se puede falsificar desde el otro lado de la llamada.',
    },
  ],
  suplantacion: [
    {
      pregunta: "Un contacto conocido te escribe desde 'otro número nuevo' pidiendo dinero urgente. ¿Qué haces?",
      opciones: [
        'Le mando el dinero porque lo conozco',
        'Confirmo por una llamada o canal distinto antes de mandar nada',
        'Le pido que me llame para reconocer la voz',
        'Ignoro el mensaje sin avisarle a nadie',
      ],
      correcta: 1,
      explicacion: 'Confirmar por un canal aparte es lo que descubre si de verdad es tu contacto o alguien que le robó la cuenta.',
    },
    {
      pregunta: '¿Cuál es la señal más fuerte de que un perfil está clonado?',
      opciones: [
        'Tiene pocas publicaciones',
        'Usa una foto de perfil distinta a la que recuerdas',
        'Tiene pocos amigos en común',
        'Te contacta por primera vez pidiendo algo urgente y con prisa',
      ],
      correcta: 3,
      explicacion: 'Un contacto de verdad casi nunca abre la conversación pidiendo dinero con prisa.',
    },
  ],
  estafa: [
    {
      pregunta: "Te ofrecen algo 'a mitad de precio' con pago urgente por transferencia. ¿Qué haces?",
      opciones: [
        'Pago rápido antes de que se acabe la oferta',
        'Pido una foto del producto como garantía',
        'Desconfío de la urgencia y busco el precio real en otro lado',
        'Pago la mitad primero y el resto después',
      ],
      correcta: 2,
      explicacion: 'Un precio y una prisa así de exagerados son la combinación clásica de una estafa de compra.',
    },
    {
      pregunta: '¿Qué hace más segura una compra en línea?',
      opciones: [
        'Que el vendedor tenga muchas fotos',
        'Pagar por un medio que protege al comprador, no una transferencia directa',
        'Que el precio sea el más bajo que encontraste',
        'Que respondan rápido a los mensajes',
      ],
      correcta: 1,
      explicacion: 'Una transferencia directa no se puede reversar; un medio con protección al comprador sí da margen si algo sale mal.',
    },
  ],
  fisico: [
    {
      pregunta: 'Encuentras una memoria USB desconocida en la oficina. ¿Qué haces?',
      opciones: [
        'La conecto para ver de quién es',
        'La guardo por si es útil',
        'La dejo donde estaba y no digo nada',
        'No la conecto a ningún equipo; la entrego a quien corresponda',
      ],
      correcta: 3,
      explicacion: 'Una USB desconocida puede estar preparada para infectar el primer equipo donde se conecte.',
    },
    {
      pregunta: '¿Cuál es el mayor riesgo de una clave anotada pegada al monitor?',
      opciones: [
        'Que se vea desordenado',
        'Que cualquiera que pase por el puesto la pueda leer y usar',
        'Que se despegue el papel',
        'Que otra persona la copie mal',
      ],
      correcta: 1,
      explicacion: 'Una clave a la vista deja de ser un secreto para cualquiera que pase por ahí, no solo para quien la escribió.',
    },
  ],
  'asistentes-ia': [
    {
      pregunta: 'Vas a pegar un correo o documento en un asistente de IA para que te ayude. ¿Qué deberías revisar antes?',
      opciones: [
        'Que no tenga datos personales o confidenciales que no deban salir de la empresa',
        'Que el documento sea corto',
        'Que el asistente sea gratuito',
        'Que el documento tenga buena redacción',
      ],
      correcta: 0,
      explicacion: 'Lo que le pegas a un asistente sale de tu control apenas lo envías, sin importar qué tan útil sea la herramienta.',
    },
    {
      pregunta: "¿Por qué un asistente de IA puede ser un riesgo aunque no sea 'un atacante'?",
      opciones: [
        'Porque puede tardar en responder',
        'Porque lo que le compartes puede guardarse o usarse fuera de tu control',
        'Porque da respuestas muy largas',
        'Porque necesita internet para funcionar',
      ],
      correcta: 1,
      explicacion: 'El riesgo no es que la IA "ataque": es que un dato confidencial ya salió de donde debía quedarse.',
    },
  ],
}

// Alguien pudo llegar aquí sin que el módulo tenga preguntas propias
// definidas todavía; con esto no se rompe, solo se ve un poco menos
// específico. No debería pasar con el catálogo actual (los 7 módulos activos
// están arriba), pero un módulo nuevo no debe tumbar la pantalla.
const PREGUNTAS_POR_DEFECTO: Question[] = [
  {
    pregunta: '¿Qué deberías hacer si algo te genera duda, como lo que viste en este módulo?',
    opciones: [
      'Actuar rápido para no perder la oportunidad',
      'Verificarlo por un canal que tú mismo conoces, no el que te dieron',
      'Hacer clic para ver de qué se trata',
      'Ignorarlo, ya se resolverá solo',
    ],
    correcta: 1,
    explicacion: 'Comprobar por tu propio canal es lo único que no depende de confiar en quien te escribe.',
  },
  {
    pregunta: '¿Cuál de estas es casi siempre una señal de alerta?',
    opciones: [
      'Que venga de un número o correo conocido',
      'Que el mensaje tenga tu nombre completo',
      'Que te presionen a decidir ya mismo, sin tiempo para pensar',
      'Que te escriban en horario de oficina',
    ],
    correcta: 2,
    explicacion: 'La prisa es la herramienta favorita del engaño: no te deja parar a verificar.',
  },
]

interface ModuleQuizProps {
  seccionId: string
  onComplete: () => void
}

// Dos preguntas antes de la pantalla de "siguiente módulo" (issue #230): sin
// botón de cerrar a propósito, es la condición para avanzar, no un aviso que
// se pueda saltar.
function ModuleQuiz({ seccionId, onComplete }: Readonly<ModuleQuizProps>) {
  const preguntas = PREGUNTAS_POR_MODULO[seccionId] ?? PREGUNTAS_POR_DEFECTO

  const [paso, setPaso] = useState(0)
  const [elegida, setElegida] = useState<number | null>(null)
  const [resultado, setResultado] = useState<'correcta' | 'incorrecta' | null>(null)

  const pregunta = preguntas[paso]!
  const esUltima = paso === preguntas.length - 1

  function comprobar() {
    if (elegida === null) return
    setResultado(elegida === pregunta.correcta ? 'correcta' : 'incorrecta')
  }

  function siguiente() {
    if (esUltima) {
      onComplete()
      return
    }
    setPaso((p) => p + 1)
    setElegida(null)
    setResultado(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-minitest"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-canvas px-6 py-10 ${TRAMA_FONDO}`}
    >
      <p id="titulo-minitest" className="mb-4 text-center font-display text-2xl uppercase tracking-[0.01em] text-ink sm:text-3xl">
        Preguntas de refuerzo
      </p>

      <Ticket className="w-full max-w-md">
        <div className="px-6 py-8">
          <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
            Pregunta {paso + 1} de {preguntas.length}
          </p>
          <p id="pregunta-actual" className="mt-2 text-lg font-semibold text-ink">
            {pregunta.pregunta}
          </p>

          <div role="radiogroup" aria-labelledby="pregunta-actual" className="mt-5 grid gap-2">
            {pregunta.opciones.map((opcion, index) => (
              <label
                key={opcion}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-base leading-relaxed transition ${
                  elegida === index
                    ? 'border-link bg-canvas-soft text-ink'
                    : 'border-hairline-strong text-ink hover:bg-canvas-soft'
                }`}
              >
                <input
                  type="radio"
                  name="opcion"
                  className="size-4 shrink-0"
                  checked={elegida === index}
                  disabled={resultado === 'correcta'}
                  onChange={() => {
                    setElegida(index)
                    setResultado(null)
                  }}
                />
                {opcion}
              </label>
            ))}
          </div>

          {resultado === 'correcta' && (
            <p className="mt-4 text-base font-medium text-success-ink">¡Correcto! {pregunta.explicacion}</p>
          )}
          {resultado === 'incorrecta' && (
            <p className="mt-4 text-base font-medium text-danger">No es esa. Vuelve a intentarlo.</p>
          )}

          {resultado === 'correcta' ? (
            <button
              type="button"
              onClick={siguiente}
              className="mt-5 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              {esUltima ? 'Continuar' : 'Siguiente pregunta'}
            </button>
          ) : (
            <button
              type="button"
              onClick={comprobar}
              disabled={elegida === null}
              className="mt-5 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:opacity-50"
            >
              Comprobar
            </button>
          )}
        </div>
      </Ticket>
    </div>
  )
}

export default ModuleQuiz
