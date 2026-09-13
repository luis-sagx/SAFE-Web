import { Info } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import AppHeader, { BACK_CLASS } from "./AppHeader";
import ScenarioEndNotice from "./ui/AvisoFinEscenario";
import ScenarioContext, { type Context } from "./ui/ContextoEscenario";
import type { ScenarioResult } from "../hooks/useScenarioRun";
import { useAuth } from "../context/AuthContext";
import { getSectionScenarios, getScenario, getSection } from "../data/catalogo";
import IdentityCard, { type IdentityData } from "./ui/TarjetaIdentidad";
import { ViewedReviewContext } from "./ui/repasoVisto";

interface ScenarioLayoutProps {
  /** Misma clave que recibe useScenarioRun, p. ej. 'estafa/saldo-contable'. */
  escenarioId: string;
  /** Una línea; queda visible durante todo el escenario. */
  resumen: string;
  /** La situación: quién eres y qué te está pasando. Solo historia, nada de mecánica.
   *  Va en piezas y no como prosa libre: el formato lo pone el layout (ver ContextoEscenario). */
  contexto: Context;
  /** Cómo se juega. Aparece únicamente en el briefing, antes de entrar. */
  nota?: ReactNode;
  /** Datos prestados que este escenario pone en juego, además del correo (siempre presente).
   *  Cada guion declara solo los que usa, para no meter ruido en escenarios sin dinero. */
  identidad?: IdentityData[];
  /** Dominio del correo del participante dentro de este escenario. Los
   *  ambientados en una empresa lo fijan al de esa empresa; el resto usan el
   *  del entrenamiento. */
  dominioCorreo?: string;
  /** Va dentro del marco del dispositivo. Solo lo que la app real mostraría. */
  pantalla: ReactNode;
  /** Va debajo del marco: pregunta, opciones, feedback, resultado. */
  decision: ReactNode;
  /** Oculta la columna lateral cuando la interacción vive dentro de la pantalla. */
  ocultarDecision?: boolean;
  /** Con qué resultado cerró la corrida, o nada mientras siga abierta. El layout lo usa
   *  para el diálogo de fin, porque el resultado sale al costado (ver AvisoFinEscenario). */
  resultado?: ScenarioResult;
  onEmpezar: () => void;
  /** Forma del marco exterior. 'telefono' es el default (SMS, llamada, chat); 'escritorio'
   *  es para correo y web, así el phishing se distingue de inmediato del resto. */
  dispositivo?: "telefono" | "escritorio" | "escena";
}

// Marco común: si la app real lo mostraría va en `pantalla`, si no va en `decision`.
// MARCO_TELEFONO: relación 0.60 (no la real ~0.46, que estrangularía formularios/hilos
// largos). border-control, no border-hairline-strong: mantiene 3:1 aun en apps oscuras.
const FRAME_PHONE =
  "sm:max-h-[50rem] sm:w-[30rem] sm:rounded-[1.75rem] sm:border-2 sm:border-control sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[50rem] lg:max-h-full lg:flex-none lg:self-center";

// MARCO_ESCRITORIO: ancho con calc(100vw - <columna>) para quedarse con TODO lo que
// sobra, no un porcentaje fijo. La resta varía por breakpoint porque la columna de
// decisión mide distinto en cada uno. self-center porque h-full ya ocupa el alto.
const FRAME_DESKTOP =
  "sm:max-h-[min(88vh,60rem)] sm:w-[96vw] sm:max-w-[68.75rem] sm:rounded-lg sm:border-[3px] sm:border-control sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-full lg:max-h-[60rem] lg:w-[calc(100vw-28.75rem)] lg:min-w-[35rem] lg:max-w-[75rem] lg:flex-none lg:self-center xl:w-[calc(100vw-33.75rem)]";

const FRAME_SCENE =
  "sm:max-h-[min(88vh,60rem)] sm:w-[96vw] sm:max-w-[68.75rem] sm:rounded-xl sm:border-2 sm:border-control sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[min(62vh,38rem)] lg:max-h-[38rem] lg:w-fit lg:max-w-full lg:flex-none lg:self-center";

function ScenarioLayout({
  escenarioId: scenarioId,
  resumen: summary,
  contexto: context,
  nota: note,
  identidad: identity = [],
  dominioCorreo: emailDomain,
  pantalla: screen,
  decision,
  ocultarDecision: hideDecision = false,
  resultado: result,
  onEmpezar: onStart,
  dispositivo: device = "telefono",
}: ScenarioLayoutProps) {
  const scenario = getScenario(scenarioId);

  if (!scenario) {
    throw new Error(`Escenario "${scenarioId}" no está en el catálogo.`);
  }

  // El nombre y el rol salían en la barra del escenario y ocupaban el sitio
  // donde ahora va la ubicación en el recorrido. Quién eres ya lo sabes; en
  // qué punto del módulo estás, no había forma de saberlo sin salir.
  const { displayName, correoSimulado: simulatedEmail, usuarioSimulado: simulatedUser } = useAuth();
  const scenarioEmail = emailDomain
    ? `${simulatedUser}@${emailDomain}`
    : simulatedEmail;
  const [phase, setPhase] = useState<"briefing" | "escenario">("briefing");
  // Lo enciende PanelVeredicto al llegar al cierre del repaso. Se apaga al
  // reiniciar (cuando `resultado` vuelve a quedar sin valor), para que el
  // siguiente intento vuelva a exigir ver las señales antes de salir sin más.
  const [reviewSeen, setReviewSeen] = useState(false);
  useEffect(() => {
    if (!result) setReviewSeen(false);
  }, [result]);
  const decided = Boolean(result);
  const cleanExit = decided && reviewSeen;
  const startRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dialogueRef = useRef<HTMLDialogElement>(null);
  const exitRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (phase === "briefing") {
      startRef.current?.focus();
    } else {
      sceneRef.current?.focus();
    }
  }, [phase]);

  function handleStart() {
    // Reinicia la corrida para que durationMs no incluya el tiempo de lectura
    // del briefing: el hook fija startedAt al montarse, mucho antes de esto.
    onStart();
    setPhase("escenario");
  }

  const section = getSection(scenario.seccionId);
  const fromModule = getSectionScenarios(scenario.seccionId);
  const position = fromModule.findIndex((e) => e.id === scenario.id) + 1;

  /** "Phishing · 3 de 8". Dentro del escenario no había forma de saber en qué
   *  punto del recorrido se estaba sin salirse de él. */
  const location = position > 0 && (
    <p className="shrink-0 text-muted">
      {section?.titulo}
      <span aria-hidden className="mx-1.5 text-muted-soft">
        ·
      </span>
      <span className="tabular-nums">
        {position} de {fromModule.length}
      </span>
    </p>
  );

  const back = (
    <Link
      to={`/seccion/${scenario.seccionId}`}
      className={BACK_CLASS}
    >
      ← Volver a la sección
    </Link>
  );

  /** La salida de dentro del escenario. Mientras quede algo a medias confirma una vez
   *  (la corrida solo se registra al llegar a un final); ya visto todo, es un enlace normal. */
  const exit = cleanExit ? (
    <Link to={`/seccion/${scenario.seccionId}`} className={BACK_CLASS}>
      ← Salir
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => exitRef.current?.showModal()}
      className={BACK_CLASS}
    >
      {decided ? "← Salir" : "← Salir sin terminar"}
    </button>
  );

  if (phase === "briefing") {
    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader atras={back} />

        {/* Mismo ancho que dashboard/secciones; se parte en dos desde lg (izquierda lo que
            se lee entero, derecha lo que se consulta) para que el botón, que cuelga de la
            columna más alta, no quede flotando lejos del texto que acompaña. */}
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="flex flex-wrap items-baseline gap-x-2 text-base font-medium text-muted">
            <span>{section?.canal}</span>
            {position > 0 && (
              <>
                <span aria-hidden className="text-muted-soft">
                  ·
                </span>
                <span className="tabular-nums">
                  Escenario {position} de {fromModule.length}
                </span>
              </>
            )}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
            {scenario.titulo}
          </h1>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14">
            <div>
              {/* El saludo con nombre vive aquí y no en cada escenario: la
                  historia que escribe el autor empieza siempre en la escena, y
                  quién la protagoniza lo sabe el layout, no el guion. */}
              <p className="text-lg leading-relaxed text-ink">
                Hola, <strong className="font-semibold">{displayName}</strong>.
                Esto es lo que te está pasando:
              </p>

              <div className="mt-5">
                <ScenarioContext contexto={context} />
              </div>

              {/* Sin caja: es una frase más de lo que estás a punto de hacer,
                  no un aviso aparte. Encerrada tenía el peso de una advertencia
                  y partía en dos la lectura justo antes del botón. */}
              {note && (
                <div className="mt-6 text-base leading-relaxed text-body">
                  {note}
                </div>
              )}
            </div>

            {/* Ocupa las dos filas para que el botón, en la segunda, no espere a esta
                columna: con historia corta la tarjeta es más alta y el botón colgaba. */}
            <div className="lg:row-span-2">
              {/* Se avisa antes de entrar: sin esto alguien podría creer que le llegó un
                  correo real. Va como tarjeta, no como frase, porque los mismos datos
                  vuelven a aparecer en un formulario dentro del escenario. */}
              <IdentityCard correo={scenarioEmail} datos={identity} />
              <p className="mt-3 text-base leading-relaxed text-body">
                Nada de lo que ocurra aquí sale ni entra a tu correo real, ni
                tiene que ver con tus datos de verdad.
              </p>
            </div>

            {/* Debajo de la historia, no de la página: es lo que se pulsa
                cuando terminas de leerla. `self-start` lo mantiene pegado a
                ella aunque la columna de al lado siga bajando. */}
            <button
              ref={startRef}
              type="button"
              onClick={handleStart}
              className="min-h-12 justify-self-start rounded-md bg-primary px-7 py-3.5 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link lg:col-start-1 lg:row-start-2 lg:self-start"
            >
              Empezar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    // Desde 640px la página no se desplaza, solo el interior del dispositivo. Por debajo
    // sí, a propósito: en celular, 844px repartidos entre barra/dispositivo/decisión
    // dejaban al correo unas tres líneas visibles dentro de una caja a desplazar por dentro.
    <div className="flex min-h-dvh flex-col bg-canvas-soft sm:h-dvh sm:overflow-hidden">
      {/* El resumen dejó de vivir en el header: ya hay suficiente que leer ahí. Sigue
          disponible en el diálogo "Ver contexto y mis datos". */}
      <AppHeader atras={exit}>{location}</AppHeader>

      {/* Apilado hasta 1024px; lado a lado arriba de eso, porque a 900px de alto apilar
          un dispositivo creíble y un bloque de opciones largo aplasta al dispositivo. */}
      <main className="flex min-h-0 flex-1 flex-col items-center sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8 lg:py-6 [@media(max-height:940px)]:sm:py-2 [@media(max-height:940px)]:lg:py-3">
        <div
          ref={sceneRef}
          // Fijo a propósito: el recorrido de señales ubica el elemento a resaltar con
          // document.getElementById; solo hay un escenario montado a la vez.
          id="pantalla-escenario"
          tabIndex={-1}
          aria-label={`${scenario.titulo}: pantalla simulada`}
          // relative: el aviso de fin se posiciona contra este marco. min-h solo para
          // celular: sin él el marco se comprimía y la pantalla dejaba de leerse.
          className={`relative flex min-h-[34rem] w-full flex-1 overflow-hidden focus:outline-none sm:min-h-0 ${
            device === "escena"
              ? FRAME_SCENE
              : device === "escritorio"
                ? FRAME_DESKTOP
                : FRAME_PHONE
          }`}
        >
          {screen}
          <ScenarioEndNotice resultado={result} />
        </div>

        {!hideDecision && (
          /* En celular va debajo y se desplaza con la página; de 640 a 1024 sigue apilado
              pero es el bloque el que se desplaza (máx. media pantalla). Al costado, todo el alto. */
          <div className="w-full shrink-0 border-t border-hairline bg-canvas px-4 py-4 sm:max-h-[45%] sm:w-[28.75rem] sm:overflow-y-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:w-[23.75rem] lg:max-h-full lg:self-center xl:w-[28.75rem]">
            {/* La historia queda a un clic, en un diálogo, porque se consulta poco. Con
                aspecto de enlace (sigue siendo <button>) para no competir en peso con
                "¿Qué haces?" y desviar la atención de lo único que hay que hacer aquí. */}
            <button
              type="button"
              onClick={() => dialogueRef.current?.showModal()}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link whitespace-nowrap"
            >
              <Info aria-hidden className="size-3.5" strokeWidth={2} />
              {/* El nombre dice lo que hay dentro: quien se olvidó de su cédula
                  ficticia no va a buscarla detrás de una palabra que promete
                  otra cosa. */}
              Ver contexto y mis datos
            </button>

            <ViewedReviewContext.Provider value={setReviewSeen}>
              {decision}
            </ViewedReviewContext.Provider>
          </div>
        )}
      </main>

      {/* <dialog> nativo: el navegador ya resuelve el foco atrapado, el cierre
          con Escape y el fondo inerte. Una capa propia con divs tendría que
          reimplementar las tres cosas y saldría peor. */}
      <dialog
        ref={dialogueRef}
        aria-labelledby="titulo-contexto"
        // Mismo ancho que el saludo de bienvenida (Bienvenida.tsx): son los
        // dos únicos modales de la app y no hay motivo para que midan distinto.
        className="m-auto w-[min(92vw,42rem)] rounded-xl border border-hairline-strong bg-surface p-8 text-ink shadow-card backdrop:bg-scrim"
      >
        <h2
          id="titulo-contexto"
          className="text-xs font-semibold uppercase tracking-[0.88px] text-muted"
        >
          Tu situación
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-ink">
          Hola, <strong className="font-semibold">{displayName}</strong>. {summary}
        </p>
        <div className="mt-3">
          <ScenarioContext contexto={context} />
        </div>

        {/* Entre el briefing y el formulario que pide la cédula pueden pasar minutos;
            si ya no recuerdas que esos números eran los tuyos, el formulario queda vacío. */}
        <div className="mt-6">
          <IdentityCard correo={scenarioEmail} datos={identity} />
        </div>

        <form method="dialog" className="mt-6 flex justify-end">
          <button
            type="submit"
            className="min-h-11 rounded-md bg-primary px-6 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Seguir
          </button>
        </form>
      </dialog>

      {/* Confirmación de salida, un paso, con el peso visual en la opción segura (quedarse).
          Lo que avisa cambia según qué quede a medias. Ver `salir` para cuándo no abre. */}
      <dialog
        ref={exitRef}
        aria-labelledby="titulo-salida"
        className="m-auto w-[min(92vw,30rem)] rounded-xl border border-hairline-strong bg-surface p-8 text-ink shadow-card backdrop:bg-scrim"
      >
        <h2 id="titulo-salida" className="text-xl font-semibold text-ink">
          {decided ? "¿Salir sin ver las señales?" : "¿Salir del escenario?"}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-body">
          {decided
            ? "Tu intento ya quedó registrado, pero todavía no has visto las señales que delataban el engaño. Puedes volver a verlas cuando quieras."
            : "Todavía no has decidido nada, así que este intento no se va a guardar. Puedes volver a empezarlo cuando quieras."}
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link
            to={`/seccion/${scenario.seccionId}`}
            className="flex min-h-11 items-center rounded-md border border-hairline-strong bg-surface px-5 text-base font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Salir
          </Link>
          <form method="dialog">
            <button
              type="submit"
              className="min-h-11 rounded-md bg-primary px-5 text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              Seguir aquí
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

export default ScenarioLayout;
