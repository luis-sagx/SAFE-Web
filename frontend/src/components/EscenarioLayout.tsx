import { Info } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import AppHeader from "./AppHeader";
import InfoLink from "./InfoLink";
import AvisoFinEscenario from "./ui/AvisoFinEscenario";
import ContextoEscenario, { type Contexto } from "./ui/ContextoEscenario";
import type { ResultadoEscenario } from "../hooks/useScenarioRun";
import { useAuth } from "../context/AuthContext";
import { getEscenario, getSeccion } from "../data/catalogo";
import TarjetaIdentidad, { type DatoIdentidad } from "./ui/TarjetaIdentidad";

interface EscenarioLayoutProps {
  /** Misma clave que recibe useScenarioRun, p. ej. 'estafa/saldo-contable'. */
  escenarioId: string;
  /** Una línea; queda visible durante todo el escenario. */
  resumen: string;
  /** La situación: quién eres y qué te está pasando. Solo historia, nada de
   *  mecánica — acompaña al participante también dentro del escenario, donde
   *  una frase como "vas a ver tu correo" ya no tendría sentido.
   *
   *  Va en piezas y no como prosa libre: el formato lo pone el layout para
   *  todos los escenarios a la vez (ver ContextoEscenario). */
  contexto: Contexto;
  /** Cómo se juega. Aparece únicamente en el briefing, antes de entrar. */
  nota?: ReactNode;
  /** Datos prestados que este escenario pone en juego, además del correo, que
   *  va siempre. Un formulario que pide la cédula no significa nada si no sabes
   *  cuál es la tuya aquí dentro; y una cuenta bancaria en un escenario donde
   *  no aparece dinero solo sería ruido, así que cada guion declara la suya. */
  identidad?: DatoIdentidad[];
  /** Dominio del correo del participante dentro de este escenario. Los
   *  ambientados en una empresa lo fijan al de esa empresa; el resto usan el
   *  del entrenamiento. */
  dominioCorreo?: string;
  /** Va dentro del marco del dispositivo. Solo lo que la app real mostraría. */
  pantalla: ReactNode;
  /** Va debajo del marco: pregunta, opciones, feedback, resultado. */
  decision: ReactNode;
  /** Con qué resultado cerró la corrida, o nada mientras siga abierta.
   *
   *  El layout lo usa para el diálogo de fin: el resultado sale al costado, y
   *  quien estaba mirando la pantalla no se enteraba de que ya había decidido.
   *  Ver AvisoFinEscenario. */
  resultado?: ResultadoEscenario;
  onEmpezar: () => void;
  /** Forma del marco exterior. 'telefono' es el default: la mayoría de
   *  escenarios (SMS, llamada, chat) se abren en el celular. 'escritorio' es
   *  para correo y web: el phishing se abre más en computador, y así se
   *  distingue de inmediato del resto de amenazas, que sí son de celular. */
  dispositivo?: "telefono" | "escritorio";
}

/**
 * Marco común de los escenarios. Sostiene una sola regla: si la app real lo
 * mostraría va en `pantalla`, si no va en `decision`. Un participante no aparece
 * dentro de su propia app bancaria y un banco no tiene una sección "Contexto".
 */
/** Alto y angosto, como se sostiene un celular. */
const MARCO_TELEFONO =
  "sm:max-h-[40rem] sm:w-[28.75rem] sm:rounded-[1.75rem] sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[40rem] lg:max-h-full lg:flex-none lg:self-center";

/** Ancho y bajo, como una ventana de escritorio. Los anchos con vw + min/max
 *
 *  El ancho se pide con `calc(100vw - <columna>)` y no con una fracción del
 *  viewport: lo que se resta es lo que ocupan la columna de decisión, el hueco
 *  entre ambas y los márgenes. Así la ventana se queda con TODO lo que sobra en
 *  vez de con un porcentaje fijo, que en pantallas anchas dejaba un vacío enorme
 *  a los lados y en las estrechas se pasaba de largo.
 *
 *  Y se resta distinto en cada tramo porque la columna de decisión mide
 *  distinto: 23.75rem de 1024 a 1279, 28.75rem de ahí para arriba. Con el
 *  33.75rem de xl aplicado también abajo, la ventana renunciaba a unos 10rem
 *  que nadie estaba usando — justo en el tamaño de pantalla donde más falta
 *  hacían.
 *
 *  `self-center` y no `self-stretch`: al estirar, el tope de 720px deja la
 *  ventana anclada arriba del todo en una pantalla alta, con el hueco entero
 *  debajo. Con `h-full` ya ocupa el alto disponible, así que centrarla solo
 *  reparte lo que sobre cuando el tope se queda corto.
 */
const MARCO_ESCRITORIO =
  "sm:max-h-[min(88vh,60rem)] sm:w-[96vw] sm:max-w-[68.75rem] sm:rounded-xl sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-full lg:max-h-[60rem] lg:w-[calc(100vw-28.75rem)] lg:min-w-[35rem] lg:max-w-[75rem] lg:flex-none lg:self-center xl:w-[calc(100vw-33.75rem)]";

function EscenarioLayout({
  escenarioId,
  resumen,
  contexto,
  nota,
  identidad = [],
  dominioCorreo,
  pantalla,
  decision,
  resultado,
  onEmpezar,
  dispositivo = "telefono",
}: EscenarioLayoutProps) {
  const escenario = getEscenario(escenarioId);

  if (!escenario) {
    throw new Error(`Escenario "${escenarioId}" no está en el catálogo.`);
  }

  const { displayName, roleLabel, correoSimulado, usuarioSimulado } = useAuth();
  const correoDelEscenario = dominioCorreo
    ? `${usuarioSimulado}@${dominioCorreo}`
    : correoSimulado;
  const [fase, setFase] = useState<"briefing" | "escenario">("briefing");
  const empezarRef = useRef<HTMLButtonElement>(null);
  const escenaRef = useRef<HTMLDivElement>(null);
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (fase === "briefing") {
      empezarRef.current?.focus();
    } else {
      escenaRef.current?.focus();
    }
  }, [fase]);

  function handleEmpezar() {
    // Reinicia la corrida para que durationMs no incluya el tiempo de lectura
    // del briefing: el hook fija startedAt al montarse, mucho antes de esto.
    onEmpezar();
    setFase("escenario");
  }

  const volver = (
    <Link
      to={`/seccion/${escenario.seccionId}`}
      className="text-base font-medium text-link underline"
    >
      ← Volver a la sección
    </Link>
  );

  if (fase === "briefing") {
    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader>
          {volver}
          <InfoLink />
        </AppHeader>

        {/* Mismo ancho que el dashboard y las secciones. Con el contenido en
            una sola columna esa medida daría renglones larguísimos, así que a
            partir de lg se parte en dos: a la izquierda lo que se lee entero
            —la historia y cómo se juega—, a la derecha lo que se consulta.

            El reparto no es solo temático: el botón va debajo de las dos
            columnas, así que cuelga de la más alta. Con "cómo se juega" a la
            derecha, esa columna doblaba en alto a la otra y el botón quedaba
            flotando muy por debajo del texto que acompaña. */}
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-base font-medium text-muted">
            {getSeccion(escenario.seccionId)?.canal}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
            {escenario.titulo}
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
                <ContextoEscenario contexto={contexto} />
              </div>

              {/* Sin caja: es una frase más de lo que estás a punto de hacer,
                  no un aviso aparte. Encerrada tenía el peso de una advertencia
                  y partía en dos la lectura justo antes del botón. */}
              {nota && (
                <div className="mt-6 text-base leading-relaxed text-body">
                  {nota}
                </div>
              )}
            </div>

            {/* Ocupa las dos filas de la rejilla para que el botón, que vive en
                la segunda, no tenga que esperar a que esta columna termine:
                cuando la historia es corta esta tarjeta es más alta, y el botón
                quedaba colgando muy por debajo del texto al que acompaña. */}
            <div className="lg:row-span-2">
              {/* Se avisa antes de entrar, y en todos los escenarios: si
                  alguien ve su propio nombre en una bandeja simulada sin saber
                  que la dirección es inventada, puede creer que el ejercicio le
                  está mandando correo de verdad —o peor, que le llegó uno real.
                  Nada de esto existe fuera de la simulación.

                  Va como tarjeta y no como frase porque los mismos datos
                  vuelven a aparecer dentro del escenario, escritos en un
                  formulario que los pide: hay que poder reconocerlos. */}
              <TarjetaIdentidad correo={correoDelEscenario} datos={identidad} />
              <p className="mt-3 text-base leading-relaxed text-body">
                Nada de lo que ocurra aquí sale ni entra a tu correo real, ni
                tiene que ver con tus datos de verdad.
              </p>
            </div>

            {/* Debajo de la historia, no de la página: es lo que se pulsa
                cuando terminas de leerla. `self-start` lo mantiene pegado a
                ella aunque la columna de al lado siga bajando. */}
            <button
              ref={empezarRef}
              type="button"
              onClick={handleEmpezar}
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
    // h-dvh + overflow-hidden: la página no se desplaza nunca. Lo que se
    // desplaza es el interior del dispositivo, como en una app real, y el
    // bloque de decisión si su contenido no cabe.
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas-soft">
      <AppHeader>
        {volver}
        <p className="text-base text-muted lg:order-3">
          {displayName} · {roleLabel}
        </p>
        <p className="w-full text-base leading-snug text-body lg:order-2 lg:w-auto lg:flex-1 lg:px-6">
          {resumen}
        </p>
        <span className="lg:order-4">
          <InfoLink />
        </span>
      </AppHeader>

      {/* Apilado hasta 1024px; lado a lado arriba de eso. En una pantalla de
          900px de alto no entran a la vez un dispositivo creíble y un bloque de
          opciones largo: apilarlos ahí aplasta el dispositivo justo cuando es lo
          que hay que juzgar. */}
      <main className="flex min-h-0 flex-1 flex-col items-center sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8 lg:py-6 [@media(max-height:940px)]:sm:py-2 [@media(max-height:940px)]:lg:py-3">
        <div
          ref={escenaRef}
          // Fijo a propósito: el recorrido de señales de un escenario
          // interactivo ubica el elemento a resaltar con
          // document.getElementById en vez de hilar una ref nueva a través de
          // props. Solo hay un escenario montado a la vez, así que un id fijo
          // no puede colisionar.
          id="pantalla-escenario"
          tabIndex={-1}
          aria-label={`${escenario.titulo}: pantalla simulada`}
          // `relative`: el aviso de fin se posiciona contra este marco, no
          // contra la página, para taparlo exactamente a él.
          className={`relative flex min-h-0 w-full flex-1 overflow-hidden focus:outline-none ${
            dispositivo === "escritorio" ? MARCO_ESCRITORIO : MARCO_TELEFONO
          }`}
        >
          {pantalla}
          <AvisoFinEscenario resultado={resultado} />
        </div>

        {/* Apilado, el bloque nunca pasa de media pantalla: si no cabe, se
            desplaza él, no la página. Al costado puede usar todo el alto. */}
        <div className="max-h-[45%] w-full shrink-0 overflow-y-auto border-t border-hairline bg-canvas px-4 py-4 sm:w-[28.75rem] sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:w-[23.75rem] lg:max-h-full lg:self-center xl:w-[28.75rem]">
          {/* La historia queda a un clic, no ocupando espacio permanente. Vive
              en un diálogo y no en un bloque fijo porque se consulta poco: casi
              siempre se recuerda, y cuando no, se abre.

              Va encima de la decisión y con aspecto de enlace, no de botón: es
              una consulta de apoyo, no una acción del ejercicio, y compitiendo
              en peso con "¿Qué haces?" desviaba la atención de lo único que hay
              que hacer aquí. Sigue siendo un <button> porque abre un diálogo;
              solo se viste de enlace. */}
          <button
            type="button"
            onClick={() => dialogoRef.current?.showModal()}
            className="mb-4 inline-flex items-center gap-1.5 text-base font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            <Info aria-hidden className="size-3.5" strokeWidth={2} />
            {/* El nombre dice lo que hay dentro: quien se olvidó de su cédula
                ficticia no va a buscarla detrás de una palabra que promete
                otra cosa. */}
            Ver contexto y mis datos
          </button>

          {decision}
        </div>
      </main>

      {/* <dialog> nativo: el navegador ya resuelve el foco atrapado, el cierre
          con Escape y el fondo inerte. Una capa propia con divs tendría que
          reimplementar las tres cosas y saldría peor. */}
      <dialog
        ref={dialogoRef}
        aria-labelledby="titulo-contexto"
        // Mismo ancho que el saludo de bienvenida (Bienvenida.tsx): son los
        // dos únicos modales de la app y no hay motivo para que midan distinto.
        className="m-auto w-[min(92vw,42rem)] rounded-xl border border-hairline-strong bg-surface p-8 text-ink shadow-card backdrop:bg-ink/40"
      >
        <h2
          id="titulo-contexto"
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.88px] text-muted"
        >
          Tu situación
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-ink">
          Hola, <strong className="font-semibold">{displayName}</strong>.
        </p>
        <div className="mt-3">
          <ContextoEscenario contexto={contexto} />
        </div>

        {/* La tarjeta se enseña al empezar, pero entre el briefing y el
            formulario que pide la cédula pueden pasar minutos: si para
            entonces ya no recuerdas que esos números eran los tuyos, el
            formulario vuelve a ser casillas vacías. */}
        <div className="mt-6">
          <TarjetaIdentidad correo={correoDelEscenario} datos={identidad} />
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
    </div>
  );
}

export default EscenarioLayout;
