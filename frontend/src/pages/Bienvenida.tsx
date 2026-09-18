import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import Ticket from "../components/Boleto";
import Brand from "../components/Marca";
import { useAuth } from "../context/AuthContext";

/** `finalidad` no repite el canal (ya en el título); `prevención` se añadió porque faltaba;
 *  `ejemplo` usa frases reales porque se reconocen antes que una definición. */
function createThreat(
  titulo: string,
  finalidad: string,
  ejemplo: string,
  prevencion: string,
) {
  return { titulo, finalidad, ejemplo, prevencion };
}

const THREATS = [
  createThreat(
    "Phishing",
    "un correo o una página falsa que buscan robarte la clave o instalar algo dañino.",
    "\u201cTiene una factura pendiente. Valide sus datos en las próximas 24 horas.\u201d",
    "No entres por el enlace del correo. Escribe tú la dirección del sitio, o entra por donde ya sabes entrar.",
  ),
  createThreat(
    "Smishing",
    "lo mismo, pero por SMS o WhatsApp: un mensaje que imita a tu banco o una entidad real.",
    "\u201cSu cuenta será bloqueada hoy. Confirme su información aquí: bit.ly/…\u201d",
    "Tu banco no te pide datos por mensaje. Llama al número que está en tu tarjeta, nunca al que trae el mensaje.",
  ),
  createThreat(
    "Vishing",
    "una llamada de alguien que se hace pasar por soporte o tu banco para sacarte un código.",
    "\u201cLe llamo de seguridad del banco. Para cancelar un cargo, dígame el código que le acaba de llegar.\u201d",
    "Un código que llega a tu teléfono no se le dicta a nadie, llame quien llame. Cuelga y llama tú al banco.",
  ),
  createThreat(
    "Suplantación de identidad",
    "un contacto o perfil clonado que usa tu confianza en él para pedirte dinero o datos.",
    "\u201cHola, cambié de número. Estoy en un apuro, ¿me puedes hacer una transferencia?\u201d",
    "Llama a esa persona al número que ya tenías guardado. Si de verdad es ella, contesta.",
  ),
  createThreat(
    "Estafa electrónica",
    "una compra, venta o inversión falsa donde el dinero nunca llega o se pide antes de tiempo.",
    "\u201cLe quedan pocas horas para asegurar su cupo. Transfiera el 50 % y le reservamos el producto.\u201d",
    "Desconfía de la prisa y del pago por adelantado. Paga al recibir, y por medios que dejen constancia.",
  ),
  createThreat(
    "Riesgo físico",
    "información sensible expuesta en tu entorno (una clave anotada, una memoria USB), sin que nadie toque una pantalla.",
    "La clave del wifi en un papel pegado al monitor, o una memoria USB que apareció en el parqueadero.",
    "Las claves no se anotan a la vista, y una memoria que no es tuya no se conecta a tu computador.",
  ),
  createThreat(
    "Asistentes de IA",
    "una herramienta útil para redactar o resumir, pero a la que también compartes los datos que pegas en la conversación.",
    "“Mejora este correo para mi compañera: se llama Ana Pérez, su cédula es 1234567890 y su correo es ana@ejemplo.com.”",
    "Pídele ayuda con lo necesario, pero quita nombres, cédulas, correos, teléfonos y otros datos personales que no hagan falta.",
  ),
];

const PANEL = "/dashboard";

// Solo rutas internas: `from` es controlable por quien arme el enlace, así que se exige "/" único y se descarta bienvenida (evita loop).
function getDestination(from: unknown): string {
  if (typeof from !== "string") return PANEL;
  if (!from.startsWith("/") || from.startsWith("//")) return PANEL;
  if (from.startsWith("/bienvenida")) return PANEL;

  return from;
}

// RequireAuth fuerza esta pantalla en el primer ingreso; el modal (sin header/nav) evita que se lea como una pantalla más del curso.
function Welcome() {
  const { displayName, participant, marcarOnboardingVisto: markOnboardingAsSeen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = getDestination((location.state as { from?: unknown } | null)?.from);

  // Una amenaza a la vez: siete párrafos juntos se saltaban enteros (se pulsaba "Continuar" sin leer).
  const [step, setStep] = useState(0);
  const threat = step > 0 ? THREATS[step - 1] : undefined;
  const latest = step === THREATS.length;

  // Refleja el estado guardado al abrir desde el ícono ⓘ; desmarcarlo reactiva el aviso.
  const [doNotShowAgain, setDoNotShowAgain] = useState(
    participant?.onboardingVisto ?? false,
  );
  const [sending, setSending] = useState(false);

  async function handleContinue(event: FormEvent) {
    event.preventDefault();

    if (!latest) {
      setStep((current) => current + 1);
      return;
    }

    await close();
  }

  // Mismo camino en los dos casos (terminar o saltar): si "Saltar" no marcara, RequireAuth reabriría esta pantalla.
  async function close() {
    setSending(true);

    try {
      await markOnboardingAsSeen(doNotShowAgain);
    } catch {
      // Informativo: si falla el guardado, solo vuelve a aparecer la próxima vez.
    } finally {
      // replace: no debe quedar en el historial o "atrás" la reabriría.
      navigate(destination, { replace: true });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-scrim px-6 py-10">
      <Ticket className="w-full max-w-2xl p-8">
        <Brand variante="logo" className="h-9 w-auto" />

        {/* Alto fijo al paso más largo (portada): si no, la fila de botones sube y baja entre pasos. */}
        <div className="mt-3 min-h-[21rem]">
          {threat ? (
            <>
              <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                <span className="text-ink">
                  {String(step).padStart(2, "0")}
                </span>
                /{String(THREATS.length).padStart(2, "0")} Amenazas
              </p>
              <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.01em] text-ink sm:text-4xl">
                {threat.titulo}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-body">
                <span className="font-semibold text-ink">Qué es: </span>
                {threat.finalidad}
              </p>

              <p className="mt-4 rounded-md border border-dashed border-ticket-edge bg-ticket-edge/25 px-4 py-3 text-lg italic leading-relaxed text-body">
                {threat.ejemplo}
              </p>

              <p className="mt-4 text-lg leading-relaxed text-body">
                <span className="font-semibold text-ink">Cómo evitarlo: </span>
                {threat.prevencion}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl uppercase tracking-[0.01em] text-ink sm:text-4xl">
                Hola, {displayName}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-body">
                Vas a practicar a reconocer siete riesgos de seguridad, una situación
                simulada a la vez. Al final de cada una te mostramos qué señales
                había, las hayas visto o no: la idea es que entrenes el
                criterio, no que memorices una lista.
              </p>

              {/* Reglas del curso en la portada: antes no decía cómo se aprueba ni por qué los módulos aparecen cerrados. */}
              <ul className="mt-4 grid gap-2 rounded-md border border-dashed border-ticket-edge bg-ticket-edge/25 px-4 py-3 text-base leading-relaxed text-body">
                <li>
                  <strong className="text-ink">Siete módulos</strong>, uno por
                  amenaza. Se abren en orden: cada uno necesita el anterior.
                </li>
                <li>
                  Dentro de cada módulo, completa los escenarios para poner en
                  práctica lo aprendido.
                </li>
                <li>
                  Puedes fallar y reiniciar el módulo completo en cualquier momento. El avance vuelve a cero.
                </li>
              </ul>

            </>
          )}
        </div>

        {/* Indican cuánto queda sin ser clicables: saltar pasos no tiene sentido en un recorrido de 7 pantallas cortas. */}
        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {THREATS.map((other, index) => (
            <span
              key={other.titulo}
              className={`h-1.5 flex-1 rounded-full ${
                index < step ? "bg-primary" : "bg-ticket-edge"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleContinue} className="mt-6">
          {latest && (
            <label className="flex items-start gap-2.5 text-base text-body">
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={(event) => setDoNotShowAgain(event.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              No volver a mostrar esto al entrar (se reabre desde el ícono ⓘ).
            </label>
          )}

          <div className={`flex gap-3 ${latest ? "mt-5" : ""}`}>
            {/* Botón siempre presente (apagado en portada) para que no cambie de lugar el de "Siguiente". */}
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => current - 1)}
              className="h-12 rounded-md border border-ticket-edge px-5 text-base font-medium text-ink transition hover:bg-ticket-edge/40 disabled:cursor-default disabled:text-muted-soft disabled:hover:bg-transparent"
            >
              ← Anterior
            </button>

            <button
              type="submit"
              disabled={sending}
              className="h-12 flex-1 rounded-md bg-primary text-base font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
            >
              {sending ? "Un momento…" : latest ? "Continuar" : "Siguiente →"}
            </button>
          </div>

          {/* Salida desde el primer paso: siete pantallas sin forma de salir se aprenden a ignorar, y reabrir el aviso a
              mitad de un escenario no debe forzar a recorrerlo entero. */}
          {!latest && (
            <button
              type="button"
              disabled={sending}
              onClick={() => void close()}
              className="mx-auto mt-4 block text-base font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid disabled:opacity-60"
            >
              Saltar la introducción
            </button>
          )}
        </form>
      </Ticket>
    </div>
  );
}
export default Welcome;
