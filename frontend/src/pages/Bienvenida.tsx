import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

/** Las seis amenazas del estudio, una por paso.
 *
 *  `finalidad` dice qué busca quien la usa —no el canal, que ya lo dice el
 *  título— y `prevencion` dice qué hacer. Lo segundo faltaba: el aviso
 *  enumeraba seis peligros y no daba ni una defensa, que es justo lo que el
 *  participante necesita antes de empezar.
 *
 *  `ejemplo` es la frase que suena de verdad en cada ataque. Se reconoce antes
 *  un ejemplo concreto que una definición, y este público reconoce estas
 *  frases porque ya las ha recibido. */
const AMENAZAS = [
  {
    titulo: "Phishing",
    finalidad:
      "un correo o una página falsa que buscan robarte la clave o instalar algo dañino.",
    ejemplo:
      "\u201cTiene una factura pendiente. Valide sus datos en las próximas 24 horas.\u201d",
    prevencion:
      "No entres por el enlace del correo. Escribe tú la dirección del sitio, o entra por donde ya sabes entrar.",
  },
  {
    titulo: "Smishing",
    finalidad:
      "lo mismo, pero por SMS o WhatsApp: un mensaje que imita a tu banco o una entidad real.",
    ejemplo:
      "\u201cSu cuenta será bloqueada hoy. Confirme su información aquí: bit.ly/…\u201d",
    prevencion:
      "Tu banco no te pide datos por mensaje. Llama al número que está en tu tarjeta, nunca al que trae el mensaje.",
  },
  {
    titulo: "Vishing",
    finalidad:
      "una llamada de alguien que se hace pasar por soporte o tu banco para sacarte un código.",
    ejemplo:
      "\u201cLe llamo de seguridad del banco. Para cancelar un cargo, dígame el código que le acaba de llegar.\u201d",
    prevencion:
      "Un código que llega a tu teléfono no se le dicta a nadie, llame quien llame. Cuelga y llama tú al banco.",
  },
  {
    titulo: "Suplantación de identidad",
    finalidad:
      "un contacto o perfil clonado que usa tu confianza en él para pedirte dinero o datos.",
    ejemplo:
      "\u201cHola, cambié de número. Estoy en un apuro, ¿me puedes hacer una transferencia?\u201d",
    prevencion:
      "Llama a esa persona al número que ya tenías guardado. Si de verdad es ella, contesta.",
  },
  {
    titulo: "Estafa electrónica",
    finalidad:
      "una compra, venta o inversión falsa donde el dinero nunca llega o se pide antes de tiempo.",
    ejemplo:
      "\u201cLe quedan pocas horas para asegurar su cupo. Transfiera el 50 % y le reservamos el producto.\u201d",
    prevencion:
      "Desconfía de la prisa y del pago por adelantado. Paga al recibir, y por medios que dejen constancia.",
  },
  {
    titulo: "Riesgo físico",
    finalidad:
      "información sensible expuesta en tu entorno (una clave anotada, una memoria USB), sin que nadie toque una pantalla.",
    ejemplo:
      "La clave del wifi en un papel pegado al monitor, o una memoria USB que apareció en el parqueadero.",
    prevencion:
      "Las claves no se anotan a la vista, y una memoria que no es tuya no se conecta a tu computador.",
  },
];

const PANEL = "/dashboard";

/**
 * A dónde volver al cerrar el aviso.
 *
 * Solo rutas internas: `from` llega por el estado de navegación, y aceptar
 * cualquier cadena convertiría este botón en un salto a donde diga quien
 * fabrique el enlace. Se exige que empiece por una sola barra, y se descarta
 * la propia bienvenida para no dejar a nadie dando vueltas en ella.
 */
function destinoDe(from: unknown): string {
  if (typeof from !== "string") return PANEL;
  if (!from.startsWith("/") || from.startsWith("//")) return PANEL;
  if (from.startsWith("/bienvenida")) return PANEL;

  return from;
}

/**
 * Aparece sola en el primer ingreso (RequireAuth la fuerza mientras
 * `onboardingVisto` sea false) y queda disponible siempre desde el ícono ⓘ.
 * Se muestra como un modal, una tarjeta centrada, sin el header ni la
 * navegación de la app, para que se lea como un aviso puntual y no como una
 * pantalla más del curso.
 */
function Bienvenida() {
  const { displayName, participant, marcarOnboardingVisto } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = destinoDe((location.state as { from?: unknown } | null)?.from);

  // 0 es la portada; 1..6, una amenaza cada uno. De una en una y no las seis
  // juntas porque seis párrafos en una pantalla se saltan enteros: quien
  // quería empezar pulsaba "Continuar" sin haber leído ninguno.
  const [paso, setPaso] = useState(0);
  const amenaza = paso > 0 ? AMENAZAS[paso - 1] : undefined;
  const ultimo = paso === AMENAZAS.length;

  // Refleja el estado actual al entrar por el ícono ⓘ: si ya lo había
  // marcado, sigue marcado, y desmarcarlo es lo que reactiva el aviso.
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(
    participant?.onboardingVisto ?? false,
  );
  const [enviando, setEnviando] = useState(false);

  async function handleContinuar(event: FormEvent) {
    event.preventDefault();

    // Mientras queden amenazas, el botón avanza en vez de cerrar.
    if (!ultimo) {
      setPaso((actual) => actual + 1);
      return;
    }

    await cerrar();
  }

  /// Salir del aviso, tanto al terminarlo como al saltárselo. Es el mismo
  /// camino en los dos casos: marcar y navegar. Si "Saltar" no marcara,
  /// RequireAuth volvería a mandar aquí en el siguiente render y la pantalla
  /// sería inescapable.
  async function cerrar() {
    setEnviando(true);

    try {
      await marcarOnboardingVisto(noVolverAMostrar);
    } catch {
      // Informativo, no bloqueante: si falla el guardado, la única
      // consecuencia es que esta pantalla vuelva a aparecer la próxima vez.
    } finally {
      // `replace`: el aviso no debe quedarse en el historial, o volver atrás
      // desde la pantalla recuperada lo abriría otra vez.
      navigate(destino, { replace: true });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink/40 px-6 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-hairline-strong bg-surface p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          SAFE Web
        </p>

        {/* Alto reservado para el paso más largo, que ahora es la portada con
            las reglas del curso. Sin él, la fila de botones sube y baja entre
            un paso y otro, y hay que volver a buscar el botón cada vez. */}
        <div className="mt-1.5 min-h-[21rem]">
          {amenaza ? (
            <>
              <p className="text-sm font-medium text-muted">
                {paso} de {AMENAZAS.length}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                {amenaza.titulo}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-body">
                <span className="font-semibold text-ink">Qué es: </span>
                {amenaza.finalidad}
              </p>

              <p className="mt-4 rounded-md border-l-[3px] border-hairline-strong bg-canvas-soft px-4 py-3 text-lg italic leading-relaxed text-body">
                {amenaza.ejemplo}
              </p>

              <p className="mt-4 text-lg leading-relaxed text-body">
                <span className="font-semibold text-ink">Cómo evitarlo: </span>
                {amenaza.prevencion}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                Hola, {displayName}
              </h1>

              <p className="mt-3 text-lg leading-relaxed text-body">
                Vas a practicar a reconocer seis formas de fraude, una situación
                simulada a la vez. Al final de cada una te mostramos qué señales
                había, las hayas visto o no: la idea es que entrenes el
                criterio, no que memorices una lista.
              </p>

              {/* Las reglas del curso, en la portada. El aviso enumeraba seis
                  amenazas y no decía en ningún momento cómo se aprueba ni por
                  qué los módulos aparecen cerrados: el participante lo
                  descubría al chocar con un candado. */}
              <ul className="mt-4 grid gap-2 rounded-md bg-canvas-soft px-4 py-3 text-base leading-relaxed text-body">
                <li>
                  <strong className="text-ink">Seis módulos</strong>, uno por
                  amenaza. Se abren en orden: cada uno necesita el anterior.
                </li>
                <li>
                  Dentro de cada módulo,{" "}
                  <strong className="text-ink">
                    apruebas con 6 de sus 8 escenarios
                  </strong>
                  .
                </li>
                <li>
                  Puedes fallar y repetir. Cuenta tu último intento en cada
                  escenario.
                </li>
              </ul>

            </>
          )}
        </div>

        {/* Los puntos dicen cuánto queda sin obligar a contar. No son
            botones: saltar al paso cinco no tiene sentido cuando el recorrido
            dura seis pantallas cortas. */}
        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {AMENAZAS.map((otra, indice) => (
            <span
              key={otra.titulo}
              className={`h-1.5 flex-1 rounded-full ${
                indice < paso ? "bg-primary" : "bg-hairline-strong"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleContinuar} className="mt-6">
          {ultimo && (
            <label className="flex items-start gap-2.5 text-base text-body">
              <input
                type="checkbox"
                checked={noVolverAMostrar}
                onChange={(event) => setNoVolverAMostrar(event.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              No volver a mostrar esto al entrar (se reabre desde el ícono ⓘ).
            </label>
          )}

          <div className={`flex gap-3 ${ultimo ? "mt-5" : ""}`}>
            {/* Se dibuja siempre, apagado en la portada: un botón que aparece
                a mitad del recorrido mueve al otro de sitio justo cuando la
                persona va a volver a pulsarlo. */}
            <button
              type="button"
              disabled={paso === 0}
              onClick={() => setPaso((actual) => actual - 1)}
              className="h-12 rounded-md border border-hairline-strong bg-surface px-5 text-base font-medium text-ink transition hover:bg-canvas-soft disabled:cursor-default disabled:border-hairline disabled:text-muted-soft disabled:hover:bg-surface"
            >
              ← Anterior
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="h-12 flex-1 rounded-md bg-primary text-base font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
            >
              {enviando ? "Un momento…" : ultimo ? "Continuar" : "Siguiente →"}
            </button>
          </div>

          {/* Una salida desde el primer paso. Siete pantallas obligatorias sin
              forma de salirse es la pantalla que todo el mundo aprende a
              atravesar sin leer; y quien vuelve a abrir el aviso desde el ícono
              ⓘ a mitad de un escenario no debería tener que recorrerlo entero
              para regresar. Las seis amenazas siguen contadas, mejor, en la
              tarjeta de cada módulo del panel. */}
          {!ultimo && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => void cerrar()}
              className="mx-auto mt-4 block text-base font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid disabled:opacity-60"
            >
              Saltar la introducción
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
export default Bienvenida;
