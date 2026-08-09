import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

/** Las seis amenazas del estudio con su finalidad, en una frase cada una: qué
 *  busca quien la usa, no el canal por el que llega (eso ya lo dice el
 *  título). Texto corrido, no tarjetas: es un aviso que se lee una vez, no
 *  un catálogo. */
const AMENAZAS = [
  {
    titulo: "Phishing",
    finalidad:
      "un correo o una página falsa que buscan robarte la clave o instalar algo dañino.",
  },
  {
    titulo: "Smishing",
    finalidad:
      "lo mismo, pero por SMS o WhatsApp: un mensaje que imita a tu banco o una entidad real.",
  },
  {
    titulo: "Vishing",
    finalidad:
      "una llamada de alguien que se hace pasar por soporte o tu banco para sacarte un código.",
  },
  {
    titulo: "Suplantación de identidad",
    finalidad:
      "un contacto o perfil clonado que usa tu confianza en él para pedirte dinero o datos.",
  },
  {
    titulo: "Estafa electrónica",
    finalidad:
      "una compra, venta o inversión falsa donde el dinero nunca llega o se pide antes de tiempo.",
  },
  {
    titulo: "Riesgo físico",
    finalidad:
      "información sensible expuesta en tu entorno (una clave anotada, una memoria USB), sin que nadie toque una pantalla.",
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

  // Refleja el estado actual al entrar por el ícono ⓘ: si ya lo había
  // marcado, sigue marcado, y desmarcarlo es lo que reactiva el aviso.
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(
    participant?.onboardingVisto ?? false,
  );
  const [enviando, setEnviando] = useState(false);

  async function handleContinuar(event: FormEvent) {
    event.preventDefault();
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          SAFE Web
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>

        <p className="mt-3 text-base leading-relaxed text-body">
          Vas a practicar a reconocer seis formas de fraude, una situación
          simulada a la vez. Al final de cada una te mostramos qué señales
          había, las hayas visto o no: la idea es que entrenes el criterio, no
          que memorices una lista.
        </p>

        <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {AMENAZAS.map((amenaza) => (
            <p
              key={amenaza.titulo}
              className="text-sm leading-relaxed text-body"
            >
              <span className="font-semibold text-ink">{amenaza.titulo}: </span>
              {amenaza.finalidad}
            </p>
          ))}
        </div>

        <form onSubmit={handleContinuar} className="mt-6">
          <label className="flex items-start gap-2.5 text-sm text-body">
            <input
              type="checkbox"
              checked={noVolverAMostrar}
              onChange={(event) => setNoVolverAMostrar(event.target.checked)}
              className="mt-0.5 size-4 shrink-0"
            />
            No volver a mostrar esto al entrar (se reabre desde el ícono ⓘ).
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="mt-5 h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
          >
            {enviando ? "Un momento…" : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Bienvenida;
