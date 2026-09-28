import { useState } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
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
      pregunta: 'En un enlace que empieza con https://, ¿qué debes revisar para saber a qué sitio te lleva?',
      opciones: [
        'El nombre del sitio después de https:// y antes de la siguiente barra (/)',
        'El nombre del banco, aunque aparezca en medio del enlace',
        'Que la página se vea igual a la del banco',
        'Que el enlace empiece con https://',
      ],
      correcta: 0,
      explicacion: 'El nombre del sitio va después de https://. El nombre de un banco en otra parte del enlace puede engañar.',
    },
    {
      pregunta: 'Un correo te apura para confirmar tu clave con un enlace. ¿Qué haces?',
      opciones: [
        'Respondo para preguntar si el correo es real',
        'Abro la aplicación o el sitio oficial por mi cuenta',
        'Abro el enlace antes de que venza',
        'Reenvío el correo para que otra persona decida',
      ],
      correcta: 1,
      explicacion: 'Al entrar por tu cuenta, no dependes del enlace del correo.',
    },
  ],
  smishing: [
    {
      pregunta: 'Recibes un mensaje de texto que dice ser de tu banco. Incluye un enlace para revisar un cobro. ¿Qué haces?',
      opciones: [
        'Abro el enlace para revisar el cobro',
        'Respondo «STOP» al número',
        'Abro por mi cuenta la aplicación oficial del banco',
        'Reenvío el mensaje para que alguien lo confirme',
      ],
      correcta: 2,
      explicacion: 'La aplicación oficial muestra tus cobros. No necesitas abrir el enlace del mensaje.',
    },
    {
      pregunta: '¿Cuál de estos mensajes parece un engaño por mensaje de texto?',
      opciones: [
        'Un aviso de una aplicación que ya usas y que incluye tu nombre',
        'Un mensaje de un número desconocido con un enlace corto y mucha prisa',
        'Un mensaje que llega a la misma hora que uno verdadero',
        'Un mensaje bien escrito, sin errores',
      ],
      correcta: 1,
      explicacion: 'Un número desconocido, un enlace corto y la presión por actuar son señales de alerta.',
    },
  ],
  vishing: [
    {
      pregunta: 'Alguien que dice ser del banco te pide por teléfono el código que recibiste por mensaje. ¿Qué haces?',
      opciones: [
        'Se lo doy si demuestra que conoce mis datos',
        'Cuelgo y devuelvo la llamada al mismo número',
        'Se lo doy si dice que es urgente',
        'No comparto el código con nadie',
      ],
      correcta: 3,
      explicacion: 'Ese código sirve para confirmar acciones en tu cuenta. No lo compartas por teléfono.',
    },
    {
      pregunta: '¿Cómo puedes confirmar que una llamada sí es de tu banco?',
      opciones: [
        'Que la persona sepa mi nombre y número de cuenta',
        'Que reconozca el número que aparece en pantalla',
        'Llamando al número oficial que ya conozco',
        'Que al principio no me pida nada extraño',
      ],
      correcta: 2,
      explicacion: 'Si tú llamas al número oficial, puedes confirmar quién te contactó.',
    },
  ],
  suplantacion: [
    {
      pregunta: 'Un conocido te escribe desde un número nuevo y te pide dinero con urgencia. ¿Qué haces?',
      opciones: [
        'Le envío el dinero porque reconozco su nombre',
        'Le llamo al número que ya conozco antes de enviar dinero',
        'Le pido que me llame desde el número nuevo',
        'No respondo ni aviso a nadie',
      ],
      correcta: 1,
      explicacion: 'Al llamarle al número que ya conoces, confirmas que sí es esa persona.',
    },
    {
      pregunta: '¿Qué señal puede indicar que alguien está copiando el perfil de un conocido?',
      opciones: [
        'Tiene pocas publicaciones',
        'Tiene una foto distinta a la que recuerdas',
        'Tiene pocos contactos conocidos en común',
        'Te escribe por primera vez para pedir algo urgente',
      ],
      correcta: 3,
      explicacion: 'Una petición urgente de alguien que recién te escribe merece confirmación por otro medio.',
    },
  ],
  estafa: [
    {
      pregunta: 'Te ofrecen algo muy barato y te piden pagar rápido por transferencia. ¿Qué haces?',
      opciones: [
        'Pago rápido antes de que termine la oferta',
        'Pido una foto del producto y pago',
        'Busco el precio en otros lugares y reviso la oferta',
        'Envío una parte del dinero primero',
      ],
      correcta: 2,
      explicacion: 'Compara el precio y revisa la oferta antes de enviar dinero.',
    },
    {
      pregunta: '¿Qué opción ayuda a protegerte al comprar por internet?',
      opciones: [
        'Que la publicación tenga muchas fotos',
        'Pagar con un método que proteja al comprador',
        'Elegir el precio más bajo',
        'Que el vendedor responda rápido',
      ],
      correcta: 1,
      explicacion: 'Un método con protección puede ayudarte si la compra sale mal.',
    },
  ],
  fisico: [
    {
      pregunta: 'Encuentras una memoria USB que no reconoces en tu trabajo. ¿Qué haces?',
      opciones: [
        'La conecto a la computadora para ver qué tiene',
        'Me la llevo por si me sirve',
        'La dejo ahí y no aviso',
        'No la conecto y aviso a la persona encargada',
      ],
      correcta: 3,
      explicacion: 'Una memoria desconocida podría dañar la computadora. Avísale a la persona encargada.',
    },
    {
      pregunta: '¿Qué riesgo tiene dejar tu clave escrita junto a la computadora?',
      opciones: [
        'Que el espacio se vea desordenado',
        'Que otra persona la lea y entre a tu cuenta',
        'Que el papel se caiga',
        'Que alguien la copie con un error',
      ],
      correcta: 1,
      explicacion: 'Si otra persona ve la clave, podría usarla para entrar a tu cuenta.',
    },
  ],
  'asistentes-ia': [
    {
      pregunta: 'Antes de copiar un correo o documento en una IA, ¿qué debes revisar?',
      opciones: [
        'Que no incluya datos personales o información privada del trabajo',
        'Que el documento sea corto',
        'Que la herramienta sea gratis',
        'Que el texto esté bien escrito',
      ],
      correcta: 0,
      explicacion: 'Al enviar información a una IA, ya no controlas cómo se guarda o se usa.',
    },
    {
      pregunta: '¿Por qué debes cuidar lo que compartes con una IA?',
      opciones: [
        'Porque puede demorarse en responder',
        'Porque podría guardar o usar lo que le envías',
        'Porque a veces responde con mucho texto',
        'Porque necesita internet',
      ],
      correcta: 1,
      explicacion: 'La información que compartes podría quedar fuera de tu control.',
    },
  ],
}

// Alguien pudo llegar aquí sin que el módulo tenga preguntas propias
// definidas todavía; con esto no se rompe, solo se ve un poco menos
// específico. No debería pasar con el catálogo actual (los 7 módulos activos
// están arriba), pero un módulo nuevo no debe tumbar la pantalla.
const PREGUNTAS_POR_DEFECTO: Question[] = [
  {
    pregunta: 'Si un mensaje te causa dudas, ¿qué conviene hacer?',
    opciones: [
      'Actuar rápido para no perder la oferta',
      'Confirmar por un medio que ya conozco',
      'Abrir el enlace para saber de qué se trata',
      'Ignorarlo y esperar que se resuelva',
    ],
    correcta: 1,
    explicacion: 'Al confirmar por un medio conocido, no dependes de los datos del mensaje.',
  },
  {
    pregunta: '¿Qué puede ser una señal de alerta en un mensaje?',
    opciones: [
      'Que llegue de un número o correo conocido',
      'Que incluya tu nombre completo',
      'Que te apuren para decidir sin darte tiempo',
      'Que llegue durante el horario de trabajo',
    ],
    correcta: 2,
    explicacion: 'La prisa puede impedirte revisar si el mensaje es verdadero.',
  },
]

interface ModuleQuizProps {
  seccionId: string
  onComplete: () => void
}

// Dos preguntas antes de la pantalla de "siguiente módulo" (issue #230): sin
// botón de cerrar a propósito, es la condición para avanzar, no un aviso que
// se pueda saltar. Hay que responder las dos antes de saber el resultado: no
// se corrige pregunta por pregunta, se comprueban las dos juntas al final y,
// si falla alguna, la única salida es repetir la prueba completa.
function ModuleQuiz({ seccionId, onComplete }: Readonly<ModuleQuizProps>) {
  const preguntas = PREGUNTAS_POR_MODULO[seccionId] ?? PREGUNTAS_POR_DEFECTO

  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState<Array<number | null>>(() => Array(preguntas.length).fill(null))
  const [elegida, setElegida] = useState<number | null>(null)
  const [finalizado, setFinalizado] = useState(false)

  const pregunta = preguntas[paso]!
  const esUltima = paso === preguntas.length - 1
  const correctas = respuestas.filter((respuesta, index) => respuesta === preguntas[index]!.correcta).length
  const aprobado = finalizado && correctas === preguntas.length

  function avanzar() {
    if (elegida === null) return
    setRespuestas((previas) => previas.map((respuesta, index) => (index === paso ? elegida : respuesta)))
    if (esUltima) {
      setFinalizado(true)
    } else {
      setPaso((p) => p + 1)
      setElegida(null)
    }
  }

  function repetir() {
    setPaso(0)
    setRespuestas(Array(preguntas.length).fill(null))
    setElegida(null)
    setFinalizado(false)
  }

  if (finalizado) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-minitest"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-canvas px-6 py-10 ${TRAMA_FONDO}`}
      >
        <p id="titulo-minitest" className="mb-4 text-center font-display text-2xl uppercase tracking-[0.01em] text-ink sm:text-3xl">
          {aprobado ? '¡Respondiste bien!' : 'Revisa tus respuestas'}
        </p>

        <Ticket className="w-full max-w-md">
          <div className="px-6 py-8">
            <div
              role={aprobado ? 'status' : 'alert'}
              data-testid={aprobado ? 'feedback-correcto' : 'feedback-incorrecto'}
              className={`flex gap-3 rounded-lg border p-4 text-ink ${
                aprobado ? 'border-success-ink/40 bg-success/10' : 'border-danger/40 bg-danger/10'
              }`}
            >
              {aprobado ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-success-ink" strokeWidth={2.5} />
              ) : (
                <XCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-danger" strokeWidth={2.5} />
              )}
              <div>
                <h2 className={`text-base font-semibold ${aprobado ? 'text-success-ink' : 'text-danger'}`}>
                  {aprobado ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed tabular-nums">
                  {correctas}/{preguntas.length} correctas
                </p>
              </div>
            </div>

            {aprobado ? (
              <button
                type="button"
                onClick={onComplete}
                className="mt-5 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={repetir}
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                <RotateCcw aria-hidden="true" className="size-5" strokeWidth={2.5} />
                Repetir prueba
              </button>
            )}
          </div>
        </Ticket>
      </div>
    )
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
                  onChange={() => setElegida(index)}
                />
                {opcion}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={avanzar}
            disabled={elegida === null}
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:opacity-50"
          >
            {esUltima ? 'Comprobar respuestas' : 'Siguiente pregunta'}
          </button>
        </div>
      </Ticket>
    </div>
  )
}

export default ModuleQuiz
