import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import Marca from "../components/Marca";
import { useAuth } from "../context/AuthContext";

/** `finalidad` no repite el canal (ya en el título); `prevención` se añadió porque faltaba;
 *  `ejemplo` usa frases reales porque se reconocen antes que una definición. */
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

// Solo rutas internas: `from` es controlable por quien arme el enlace, así que se exige "/" único y se descarta bienvenida (evita loop).
function destinoDe(from: unknown): string {
  if (typeof from !== "string") return PANEL;
  if (!from.startsWith("/") || from.startsWith("//")) return PANEL;
  if (from.startsWith("/bienvenida")) return PANEL;

  return from;
}

// RequireAuth fuerza esta pantalla en el primer ingreso; el modal (sin header/nav) evita que se lea como una pantalla más del curso.
function Bienvenida() {
  const { displayName, participant, marcarOnboardingVisto } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = destinoDe((location.state as { from?: unknown } | null)?.from);

  // Una amenaza a la vez: seis párrafos juntos se saltaban enteros (se pulsaba "Continuar" sin leer).
  const [paso, setPaso] = useState(0);
  const amenaza = paso > 0 ? AMENAZAS[paso - 1] : undefined;
  const ultimo = paso === AMENAZAS.length;

  // Refleja el estado guardado al abrir desde el ícono ⓘ; desmarcarlo reactiva el aviso.
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(
    participant?.onboardingVisto ?? false,
  );
  const [enviando, setEnviando] = useState(false);

  async function handleContinuar(event: FormEvent) {
    event.preventDefault();

    if (!ultimo) {
      setPaso((actual) => actual + 1);
      return;
    }

    await cerrar();
  }

  // Mismo camino en los dos casos (terminar o saltar): si "Saltar" no marcara, RequireAuth reabriría esta pantalla.
  async function cerrar() {
    setEnviando(true);

    try {
      await marcarOnboardingVisto(noVolverAMostrar);
    } catch {
      // Informativo: si falla el guardado, solo vuelve a aparecer la próxima vez.
    } finally {
      // replace: no debe quedar en el historial o "atrás" la reabriría.
      navigate(destino, { replace: true });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-scrim px-6 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-hairline-strong bg-surface p-8 shadow-card">
        <Marca variante="logo" className="h-9 w-auto" />

        {/* Alto fijo al paso más largo (portada): si no, la fila de botones sube y baja entre pasos. */}
        <div className="mt-3 min-h-[21rem]">
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

              {/* Reglas del curso en la portada: antes no decía cómo se aprueba ni por qué los módulos aparecen cerrados. */}
              <ul className="mt-4 grid gap-2 rounded-md bg-canvas-soft px-4 py-3 text-base leading-relaxed text-body">
                <li>
                  <strong className="text-ink">Seis módulos</strong>, uno por
                  amenaza. Se abren en orden: cada uno necesita el anterior.
                </li>
                <li>
                  Dentro de cada módulo,{" "}
                  <strong className="text-ink">
                    apruebas con 6 de sus 8 escenarios
                  </strong>.
                </li>
                <li>
                  Puedes fallar y repetir el módulo completo. Cuenta tu última ronda completa.
                  escenario.
                </li>
              </ul>

            </>
          )}
        </div>

        {/* Indican cuánto queda sin ser clicables: saltar pasos no tiene sentido en un recorrido de 6 pantallas cortas. */}
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
            {/* Botón siempre presente (apagado en portada) para que no cambie de lugar el de "Siguiente". */}
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

          {/* Salida desde el primer paso: siete pantallas sin forma de salir se aprenden a ignorar, y reabrir el aviso a
              mitad de un escenario no debe forzar a recorrerlo entero. */}
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
