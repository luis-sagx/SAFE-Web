import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FinalActions from "./AccionesFinal";
import { ViewedReviewContext } from "./repasoVisto";
import ApprovalLabel from "./EtiquetaAprobacion";
import type { StoryNode } from "../../hooks/useStoryEngine";
import type { RunStatus } from "../../hooks/useScenarioRun";
import { outcomeFromKind } from "../../hooks/useScenarioRun";
import { useSound } from "../../context/SoundContext";
import { reproducirResultado, reproducirSenal } from "../../lib/sonidos";

export interface Signal {
  id: string;
  /** Lleva negritas <b>; contenido fijo del código, nunca de un usuario. */
  texto: string;
  targetId?: string;
  /** Nodo del grafo cuya pantalla contiene esta señal: el repaso vuelve a
   *  esa pantalla antes de resaltarla, porque el escenario puede haber
   *  avanzado a otra. */
  pantalla?: string;
}

interface VerdictPanelProps {
  escenarioId: string;
  node: StoryNode;
  senales: Signal[];
  regla: string;
  /** @deprecated Se conserva por compatibilidad con escenarios existentes. */
  restartLabel?: string;
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  onRestart?: () => void;
  contenedorId: string;
  onPantalla?: (screenId: string | undefined) => void;
  /** Si la corrida llegó al servidor; sin esto una corrida encolada por
   *  falta de red se veía igual que una guardada. */
  estadoGuardado?: RunStatus;
}

const HIGHLIGHTED_CLASS = "senal-resaltada";
function VerdictPanel({
  escenarioId: scenarioId,
  node,
  senales: signals,
  regla: rule,
  restartLabel,
  onRestart,
  contenedorId: containerId,
  onPantalla: onScreen,
  estadoGuardado: savedStatus,
}: VerdictPanelProps) {
  const hasSignals = signals.length > 0;

  // -1 = veredicto, 0..N-1 = viendo esa señal, N = cierre. Sin señales
  // arranca ya en cierre para que siempre haya un botón que avance algo.
  const [step, setStep] = useState(hasSignals ? -1 : 0);

  const showingVerdict = step === -1;
  const showingSignal = hasSignals && step >= 0 && step < signals.length;
  const completing = !showingVerdict && !showingSignal;

  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  // Una sola vez al aparecer el veredicto, no en cada paso del repaso de
  // señales (issue #221): VerdictPanel solo se monta cuando el escenario ya
  // terminó, así que "montaje" y "resultado nuevo" son lo mismo aquí.
  // 'scene' no debería llegar nunca hasta acá (solo se llega con un nodo
  // terminal), pero reproducirResultado no lo conoce: se ignora en vez de
  // forzar el tipo.
  // Guarda con ref: en StrictMode (activo en main.tsx) React monta-desmonta-
  // remonta los efectos una vez de más en desarrollo; sin esta guarda sonaban
  // dos AudioContext superpuestos por veredicto, audible como un traslape
  // raro (peor en los tonos graves de "fallar").
  const { activado: soundEnabled } = useSound();
  const soundPlayedRef = useRef(false);
  useEffect(() => {
    if (soundPlayedRef.current) return;
    soundPlayedRef.current = true;
    if (soundEnabled && node.kind !== "scene") reproducirResultado(node.kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avisa al layout cuando no queda repaso pendiente para que "Salir" no advierta nada.
  const markReviewAsViewed = useContext(ViewedReviewContext);
  useEffect(() => {
    if (completing) markReviewAsViewed?.(true);
  }, [completing, markReviewAsViewed]);

  useEffect(() => {
    const id = `run-status-${scenarioId}`;

    if (savedStatus === "queued") {
      toast.warning("No pudimos enviar el intento.", {
        id,
        description:
          "Quedó guardado en este equipo y lo reintentaremos automáticamente.",
      });
    }

    if (savedStatus === "failed") {
      toast.error("No se pudo registrar este intento.", {
        id,
        description:
          "El intento fue rechazado y no volverá a enviarse automáticamente.",
      });
    }
  }, [scenarioId, savedStatus]);

  useEffect(() => {
    onScreen?.(showingSignal ? signals[step]?.pantalla : undefined);
  }, [showingSignal, step, signals, onScreen]);

  // Un sonido por cada señal que se muestra durante el repaso (issue de
  // gamificación): a diferencia del sonido del veredicto, este efecto sí
  // puede repetirse sin guarda de ref porque cada paso es un cambio de
  // estado real posterior al montaje, no el doble-invoke de StrictMode.
  useEffect(() => {
    if (showingSignal && soundEnabled) reproducirSenal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingSignal, step]);

  useEffect(() => {
    if (!showingSignal) {
      return;
    }

    const targetId = signals[step]?.targetId;
    if (!targetId) {
      return;
    }

    let highlighted: HTMLElement | null = null;

    // Reintenta un cuadro después: la pantalla puede seguir montándose cuando corre este efecto.
    function highlight() {
      const container = document.getElementById(containerId);
      const element = container?.querySelector<HTMLElement>(
        `[data-signal="${targetId}"]`,
      );
      if (!element) {
        return false;
      }
      highlighted = element;
      element.classList.add(HIGHLIGHTED_CLASS);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }

    const id = highlight() ? 0 : window.setTimeout(highlight, 60);

    return () => {
      if (id) window.clearTimeout(id);
      highlighted?.classList.remove(HIGHLIGHTED_CLASS);
    };
  }, [showingSignal, step, signals, containerId]);

  // 'partial' no es un fallo: no puede verse igual que haber entregado la clave.
  const tone =
    node.kind === "good"
      ? {
          borde: "border-success/40",
          fondo: "bg-success",
          tinta: "text-on-success",
          icono: "✓",
        }
      : node.kind === "partial"
        ? {
            borde: "border-warning/40",
            fondo: "bg-warning",
            tinta: "text-on-warning",
            icono: "!",
          }
        : {
            borde: "border-danger/40",
            fondo: "bg-danger",
            tinta: "text-on-danger",
            icono: "✕",
          };

  return (
    <div className={`rounded-lg border bg-surface p-4 ${tone.borde}`}>
      <p className="flex items-center gap-2 text-lg font-semibold text-ink">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${tone.tinta} ${tone.fondo}`}
          aria-hidden
        >
          {tone.icono}
        </span>
        {node.verdict}
      </p>
      <p className="mt-2 text-base leading-relaxed text-body">{node.outcome}</p>

      <ApprovalLabel node={node} />

      {showingVerdict && (
        <button
          ref={firstButtonRef}
          type="button"
          className="mt-5 min-h-12 w-full origin-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition-colors hover:bg-primary-active motion-safe:animate-[boton-escala_1.8s_ease-in-out_infinite] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={() => setStep(0)}
        >
          Ver las señales
        </button>
      )}

      {showingSignal && (
        <div
          role="region"
          aria-label="Repaso de señales"
          className="mt-4 rounded-md border border-signal-border bg-signal p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-ink">
              Señal {step + 1} de {signals.length}
            </h4>
            <button
              type="button"
              className="text-base font-medium text-link underline"
              onClick={() => setStep(signals.length)}
            >
              Saltar
            </button>
          </div>
          {/* Alto reservado con todas las señales superpuestas en la misma celda
              de grid (invisibles menos la del paso actual) para que los botones
              no salten de posición entre pasos. Antes se reservaba comparando
              longitud de texto contra la señal "más larga", pero una señal con
              una URL larga sin espacios envuelve distinto a una de puro texto
              con la misma cantidad de caracteres: el alto quedaba corto y el
              texto se encimaba con los botones de abajo. */}
          <div className="relative mt-3 grid">
            {signals.map((signal, index) => (
              <p
                key={signal.id}
                aria-hidden={index !== step}
                className={`col-start-1 row-start-1 break-words text-lg leading-relaxed ${
                  index === step ? "text-signal-body" : "invisible"
                }`}
                dangerouslySetInnerHTML={{ __html: signal.texto }}
              />
            ))}
          </div>
          {/* "Anterior" se renderiza siempre (deshabilitado en el primer paso)
              para que "Siguiente" no se desplace entre pasos. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={step === 0}
              className="h-12 flex-1 rounded-md border border-hairline-strong bg-surface text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:border-hairline disabled:text-muted-soft disabled:hover:bg-surface"
              onClick={() => setStep((p) => p - 1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-primary text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              onClick={() => setStep((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {completing && (
        <>
          <div className="mt-5 rounded-md bg-canvas-soft p-4">
            <p
              className="text-lg leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: rule }}
            />
          </div>

          <FinalActions
            escenarioId={scenarioId}
            outcome={node.resultado ?? outcomeFromKind(node.kind)}
            onRestart={onRestart}
            restartLabel={restartLabel}
            autoFocus={!hasSignals}
          />
        </>
      )}
    </div>
  );
}

export default VerdictPanel;
