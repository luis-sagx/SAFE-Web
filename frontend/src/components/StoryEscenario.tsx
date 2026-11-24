import {
  ChevronLeft,
  EllipsisVertical,
  Lock,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import ScenarioLayout from "./EscenarioLayout";
import Instructions from "./ui/Instrucciones";
import { createEmailFolders } from "./ui/carpetasCorreo";
import type { Context } from "./ui/ContextoEscenario";
import DeviceScreen, { type ScreenView } from "./ui/DeviceScreen";
import AppRelleno, { esRellenoTipo, type RellenoTipo } from "./ui/AppRelleno";
import { preventNavigation, handleHotspotClick } from "./ui/interactivo";
import type { EmailAction, Clock } from "./ui/DesktopChrome";
import { Browser, type BrowserBookmark, type TabConfig } from "./ui/Navegador";
import PhoneNotification, {
  type Notification,
} from "./ui/NotificacionTelefono";
import StoryChoices from "./ui/StoryChoices";
import type { IdentityData } from "./ui/TarjetaIdentidad";
import VerdictPanel, { type Signal } from "./ui/PanelVeredicto";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";
import { formatTime, useSystemClock } from "../hooks/useRelojDelSistema";
import {
  useStoryEngine,
  type Story,
  type StoryNode,
} from "../hooks/useStoryEngine";
import { playFillerTap, playPhoneNotification } from "../lib/sonidos";
import styles from "./ui/DeviceScreen.module.css";

export interface ScreenNode extends StoryNode {
  view: ScreenView;
  senales?: Signal[];
  // Va en el nodo y no en la vista: dos nodos con la misma pantalla pueden
  // diferir en si la notificación ya llegó.
  notificacion?: Notification;
  // Pantallas que solo se observan: pasado este tiempo el grafo avanza solo.
  autoAvanza?: { ms: number; goto: string };
}

interface ScreenGuideStep {
  targetId: string;
  texto: ReactNode;
}

interface ScenarioStoryProps {
  escenarioId: string;
  resumen: string;
  contexto: Context;
  nota?: ReactNode;
  story: Story<ScreenNode>;
  initialNode?: string;
  senales: Signal[];
  rule: string;
  /** @deprecated La repetición ahora se inicia a nivel de módulo. */
  restartLabel?: string;
  pregunta?: string;
  // El escenario que las pasa debe declarar también sus finales en el grafo.
  accionesCorreo?: EmailAction[];
  dominioCorreo?: string;
  reloj?: Clock;
  marcadores?: BrowserBookmark[];
  instruccion?: ReactNode;
  cuandoTermina?: ReactNode;
  pista?: ReactNode;
  identidad?: IdentityData[];
  ocultarDecision?: boolean;
  accionesEnPantalla?: boolean;
  /** Ubica las opciones del nodo fuera de la ficción cuando sea necesario. */
  choicePlacement?: "sidebar" | "help" | "hidden";
  apps?: PhoneApp[];
  // Documento de referencia fijo junto al dispositivo, antes de "¿Qué
  // haces?", issue #184. Se lee y se decide qué copiar antes de escribir,
  // no después.
  panelReferencia?: ReactNode;
  // Issue #210: en el chat de IA cualquier clic en el área libre del chat (no
  // hay hotspots que "recorrer") prendía el aviso de "ahí no hay nada que
  // hacer", que no aplica cuando lo que se pide es escribir texto libre.
  sinAvisoClicVacio?: boolean;
  /** Guía progresiva dentro de la pantalla simulada, solo para el escenario que la declara. */
  guiaEnPantalla?: { pasos: ScreenGuideStep[] };
}

// Todas las apps del dock reaccionan al pulsarlas (deliberado: si solo
// reaccionara la que decide, el realce del cursor delataría la respuesta).
// viewNode = navegación visual, sin tocar la traza; goto = decisión narrativa
// explícita; vacia/relleno = app de relleno; ninguno = vuelve a un hilo.
export type PhoneApp = BrowserBookmark & {
  // Nodo cuya pantalla muestra la app sin reemplazar el punto actual de la
  // historia. Las acciones dentro de esa pantalla sí pueden avanzar el grafo.
  viewNode?: string;
  // Estado vacío genérico: ícono del dock agrandado + un párrafo. Sigue
  // existiendo para las apps de relleno que no tienen (todavía) un layout
  // propio en AppRelleno.tsx.
  vacia?: string;
  // Issue #187: variante con la pinta de la app real que dice ser,saldo y
  // movimientos, barra de direcciones…, en vez del párrafo genérico de
  // `vacia`. Uno de los dos, nunca ambos; como máximo una app de cada tipo
  // por escenario, porque el layout es fijo y dos "banco" en el mismo dock
  // se verían idénticas.
  relleno?: RellenoTipo;
  // A qué pantalla vuelve si no lleva goto ni vacia/relleno; solo hace falta
  // cuando el escenario tiene mensajes y llamada a la vez.
  hilo?: "sms" | "call";
  color?: string;
  // Pantalla visual alternativa durante una llamada real (no el marcador).
  viewNodeEnLlamada?: string;
  // Pantalla que abre el icono cuando NO hay llamada en curso (el marcador del
  // teléfono); con una llamada activa el icono vuelve a ella por `hilo`.
  viewNodeSinLlamada?: string;
  // Decisión alternativa durante una llamada real. Se conserva separada de
  // viewNodeEnLlamada para los pocos casos donde abrir sí deba avanzar.
  gotoEnLlamada?: string;
};

function viewTab(view: ScreenView, domain: string): TabConfig | null {
  if (view.kind === "mail") {
    return {
      titulo: "Correo",
      url: `https://correo.${domain}/recibidos`,
      segura: true,
    };
  }
  if (view.kind === "web") {
    return {
      titulo: view.title,
      url: view.url,
      segura: view.secure,
      local: view.local,
      senalUrl: view.senalUrl,
      cierra: view.cerrarGoto,
    };
  }
  // Un chat que declara `sitio` es una página, no una app: se abre en navegador.
  if (view.kind === "sms" && view.sitio) {
    return { titulo: view.sitio.titulo, url: view.sitio.url, segura: true };
  }
  return null;
}

function mobileUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function ScenarioStory({
  escenarioId: scenarioId,
  resumen: summary,
  contexto: context,
  nota: note,
  story,
  initialNode = "n1",
  senales: signals,
  rule,
  restartLabel,
  pregunta: question = "¿Qué haces?",
  accionesCorreo: emailActions,
  dominioCorreo: emailDomain,
  reloj: clock,
  marcadores: markers,
  instruccion: instruction,
  cuandoTermina: onFinished,
  pista: clue,
  identidad: identity,
  ocultarDecision: hideDecision = false,
  accionesEnPantalla: screenActions = false,
  choicePlacement = "sidebar",
  apps,
  panelReferencia: referencePanel,
  sinAvisoClicVacio: hideEmptyClickNotice = false,
  guiaEnPantalla: screenGuide,
}: ScenarioStoryProps) {
  const engine = useStoryEngine(story, initialNode, scenarioId);
  const { activado: soundEnabled } = useSound();
  const [started, setStarted] = useState(false);
  const soundedNotifications = useRef(new Set<string>());
  const lastFillerTap = useRef(-Infinity);
  const showSideChoices =
    choicePlacement === "sidebar" && Boolean(engine.node.choices);
  const showHelpChoices =
    choicePlacement === "help" && Boolean(engine.node.choices);
  const helpClue = showHelpChoices ? (
    <>
      {clue}
      <p className="font-medium text-ink my-2">
        Puedes elegir una de estas opciones:
      </p>
      <StoryChoices
        choices={engine.node.choices ?? []}
        onChoose={engine.choose}
      />
    </>
  ) : (
    clue
  );
  const { usuarioSimulado: simulatedUser } = useAuth();
  const recipient = emailDomain ? `${simulatedUser}@${emailDomain}` : undefined;

  // Durante el repaso vuelve a la pantalla que contiene cada señal.
  const [reviewScreen, setReviewScreen] = useState<string | undefined>();
  // Cambiar de pestaña es mirar, no decidir: no entra en la traza.
  const [viewedTab, setViewedTab] = useState<string | undefined>();
  // Abrir una app desde el dock también es mirar. Se mantiene separado de las
  // pestañas para que volver cierre la app sin alterar el motor de historia.
  const [viewedAppNode, setViewedAppNode] = useState<string | undefined>();
  // Abrir el hilo desde el dock conserva el nodo narrativo actual.
  const [viewedThread, setViewedThread] = useState<string | undefined>();
  // Se enciende con el primer clic en el vacío y ya no se apaga.
  const [clickedEmptySpace, setClickedEmptySpace] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  // App del dock que no decide nada (cámara, galería); vive fuera del grafo
  // igual que `pestanaMirada`.
  const [appOpen, setAppOpen] = useState<
    | { nombre: string; relleno: RellenoTipo; color?: string }
    | { nombre: string; vacia: string; Icono?: LucideIcon; color?: string }
    | undefined
  >();
  // Última pantalla de cada app de comunicación (hilo SMS y llamada en curso);
  // su icono vuelve a ella sin tocar el grafo. Son dos porque un escenario
  // puede tener las dos cosas y "volver" depende del icono pulsado.
  const [threads, setThreads] = useState<{ sms?: string; call?: string }>({});
  // Notificaciones ya vistas; `reiniciar` las limpia junto con engine.restart.
  const [discarded, setDiscarded] = useState<string[]>([]);
  // Frases del otro lado ya oídas en la llamada activa (issue #250
  // seguimiento): mirar otra app (la tienda, el navegador, el banco...)
  // desmonta y vuelve a montar la pantalla de llamada, y sin esto perdía el
  // progreso y repetía la conversación entera desde el principio al volver.
  const heardLines = useRef<Set<string>>(new Set());
  const previousNarrativeNode = useRef(engine.current);
  const visibleNode =
    reviewScreen ??
    viewedAppNode ??
    viewedThread ??
    viewedTab ??
    engine.current;
  const getNodeView = story[visibleNode]?.view ?? engine.node.view;
  // En smishing, la cabecera del hilo permite decidir también desde el dock.
  const toView =
    getNodeView.kind === "sms" &&
    !reviewScreen &&
    viewedThread &&
    !scenarioId.startsWith("smishing/")
      ? {
          ...getNodeView,
          volverGoto: undefined,
          volverLabel: undefined,
          blockGoto: undefined,
        }
      : getNodeView;

  const phoneTime = formatTime(useSystemClock());

  const domain = emailDomain ?? "safeweb.com";
  // Cada pantalla nueva abre una pestaña; se indexan por dirección para que
  // dos nodos con la misma página la compartan.
  const [open, setOpen] = useState<string[]>(["n1"]);

  useEffect(() => {
    // Un final no abre pantalla (issue #26).
    if (engine.isEnding) return;
    if (!viewTab(engine.node.view, domain)) return;
    setOpen((ids) =>
      ids.includes(engine.current) ? ids : [...ids, engine.current],
    );
    setViewedTab(undefined);
  }, [engine.current, engine.isEnding, engine.node.view, domain]);

  useEffect(() => {
    // Cuál es "Mensajes" cambia durante la corrida (tras responder, es el hilo
    // con el borrador, no el original).
    const kind = engine.node.view.kind;
    if (kind === "sms" || kind === "call") {
      setThreads((previous) => ({ ...previous, [kind]: engine.current }));
    }
  }, [engine.current, engine.node.view]);

  // Se reinicia con cada nodo y se cancela si se sale antes de tiempo.
  useEffect(() => {
    const auto = engine.node.autoAvanza;
    if (!auto || engine.isEnding) return;
    const timer = setTimeout(() => engine.choose(auto.goto), auto.ms);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.current, engine.isEnding]);

  // Pertenece a engine.current, no a la pantalla que se mira; no se pinta
  // sobre el veredicto ni durante el repaso.
  const nodeNotification = story[engine.current]?.notificacion;
  // Un chat de IA con sitio se muestra en el marco de escritorio.
  const chatInBrowser = toView.kind === "sms" && Boolean(toView.sitio);
  const phoneSimulation = screenActions && !chatInBrowser;
  // La app visible puede cubrir una llamada, pero su voz sigue teniendo prioridad.
  const callNode = threads.call ? story[threads.call]?.view : undefined;
  const callInProgress = callNode?.kind === "call" && !callNode.marcando;
  const showNotification = Boolean(
    nodeNotification &&
    !engine.isEnding &&
    !reviewScreen &&
    !viewedAppNode &&
    !discarded.includes(engine.current),
  );

  useEffect(() => {
    if (
      !started ||
      !phoneSimulation ||
      !showNotification ||
      nodeNotification?.app !== "Mensajes"
    ) return;

    const { remitente, texto, hora } = nodeNotification;
    const key = JSON.stringify([remitente, texto, hora]);
    if (soundedNotifications.current.has(key)) return;

    // Si llegó en silencio, tampoco debe sonar al volver a ver el aviso.
    soundedNotifications.current.add(key);
    if (soundEnabled && !callInProgress && toView.kind !== "call") {
      playPhoneNotification();
    }
  }, [
    callInProgress,
    nodeNotification,
    phoneSimulation,
    showNotification,
    soundEnabled,
    started,
    toView.kind,
  ]);

  useEffect(() => {
    const previous = previousNarrativeNode.current;
    if (previous !== engine.current) {
      // Solo abandonar el nodo narrativo consume su notificación. Taparla con
      // otra app no equivale a descartarla.
      if (story[previous]?.notificacion) {
        setDiscarded((ids) =>
          ids.includes(previous) ? ids : [...ids, previous],
        );
      }
      previousNarrativeNode.current = engine.current;
    }
  }, [engine.current, story]);

  const restart = useCallback(() => {
    soundedNotifications.current.clear();
    lastFillerTap.current = -Infinity;
    setStarted(true);
    setDiscarded([]);
    setViewedAppNode(undefined);
    setViewedThread(undefined);
    setViewedTab(undefined);
    setAppOpen(undefined);
    setGuideStep(0);
    heardLines.current.clear();
    engine.restart();
  }, [engine.restart]);

  const activeGuideStep = screenGuide?.pasos[guideStep];
  const guideVisible = Boolean(
    activeGuideStep && !engine.isEnding && toView.kind === "mail",
  );

  const emailGuide =
    guideVisible && activeGuideStep && screenGuide ? (
      <aside aria-live="polite" className="text-base leading-relaxed text-body">
        <p className="font-semibold text-ink">
          Pista {guideStep + 1} de {screenGuide.pasos.length}
        </p>
        <p className="mt-1">{activeGuideStep.texto}</p>
        <button
          type="button"
          className="mt-2 min-h-10 rounded-md border border-link px-3 py-1.5 font-medium text-link transition hover:bg-link/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          onClick={(event) => {
            event.stopPropagation();
            setGuideStep((step) => step + 1);
          }}
        >
          {guideStep === screenGuide.pasos.length - 1
            ? "Ahora decide"
            : "Siguiente pista"}
        </button>
      </aside>
    ) : undefined;

  const tabs: Record<string, TabConfig> = {};
  const byUrl = new Map<string, string>();
  const visible: string[] = [];
  // Durante el repaso entra también la pantalla que se explica aunque no se
  // haya abierto (issue #24).
  const tabNodeIds =
    reviewScreen && !open.includes(reviewScreen)
      ? [...open, reviewScreen]
      : open;

  for (const id of tabNodeIds) {
    const meta = story[id] && viewTab(story[id]!.view, domain);
    if (!meta) continue;
    // Dos pantallas del mismo sitio comparten pestaña, pero la pestaña toma
    // el título y el cierre de la última que se abrió en ella.
    const alreadyOpen = byUrl.get(meta.url);
    if (alreadyOpen) {
      tabs[alreadyOpen] = meta;
      continue;
    }
    byUrl.set(meta.url, id);
    tabs[id] = meta;
    visible.push(id);
  }

  const email = Object.values(story).find(
    (node) => node.view.kind === "mail",
  )?.view;
  const folders =
    email?.kind === "mail"
      ? createEmailFolders(
          {
            nombre: email.from,
            direccion: email.address,
            asunto: email.subject,
          },
          // Durante el repaso la bandeja vuelve a tener el mensaje.
          engine.isEnding && !reviewScreen ? engine.current : undefined,
        )
      : undefined;

  const metaVisible = viewTab(toView, domain);
  const tabVisible = metaVisible && byUrl.get(metaVisible.url);
  if (tabVisible && tabs[tabVisible]) {
    tabs[tabVisible] = metaVisible;
  }

  const urlVisible = viewTab(toView, domain)?.url;
  const active = (urlVisible && byUrl.get(urlVisible)) ?? visible[0] ?? "n1";

  const onHotspot = (event: React.MouseEvent) => {
    preventNavigation(event);

    // Cambiar de pestaña se resuelve aquí y no llega al grafo.
    const closed = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-cierra]",
    )?.dataset.cierra;
    if (closed) {
      // Una pestaña puede plegar varias pantallas del mismo sitio: se cierran
      // todas con ella.
      const url = tabs[closed]?.url;
      const remaining = open.filter(
        (id) =>
          id !== closed &&
          (!story[id] || viewTab(story[id]!.view, domain)?.url !== url),
      );
      setOpen(remaining);
      // Pasa a la pestaña que sigue abierta, como al cerrar una de verdad.
      setViewedTab(remaining.at(-1));
      if (!engine.isEnding) handleHotspotClick(event, engine.choose);
      return;
    }

    const tab = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-pestana]",
    )?.dataset.pestana;
    if (tab) {
      setViewedTab(tab);
      return;
    }

    const closeApp = (event.target as HTMLElement).closest("[data-close-app]");
    if (closeApp) {
      setViewedAppNode(undefined);
      return;
    }

    // Una app abierta desde el dock cambia solo la pantalla visible. El nodo
    // narrativo se conserva hasta que se pulse una acción dentro de la app.
    const appView = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-app-view]",
    )?.dataset.appView;
    if (appView) {
      if (!engine.isEnding) {
        setAppOpen(undefined);
        setViewedAppNode(appView);
      }
      return;
    }

    // App de Mensajes: cierra lo que hubiera encima y muestra el hilo sin
    // avanzar el grafo.
    const thread = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-app-hilo]",
    )?.dataset.appHilo;
    if (thread !== undefined) {
      if (!engine.isEnding) {
        const cameFromAnotherScreen = Boolean(
          appOpen ||
          viewedAppNode ||
          (!viewedThread && engine.node.view.kind !== thread),
        );
        setViewedAppNode(undefined);
        const closeGoto =
          engine.node.view.kind === "web"
            ? engine.node.view.cerrarGoto
            : undefined;
        const closeDestination =
          closeGoto && story[closeGoto]?.view.kind === thread
            ? closeGoto
            : undefined;
        const destination =
          closeDestination ??
          (thread === "sms" || thread === "call"
            ? threads[thread]
            : undefined) ??
          threads.call ??
          threads.sms ??
          "n1";
        // Con otra pantalla encima el botón no alterna: la cierra y deja el hilo.
        setViewedThread((viewing) =>
          cameFromAnotherScreen
            ? destination
            : viewing
              ? undefined
              : destination,
        );
        setAppOpen(undefined);
      }
      return;
    }

    // Abrir una app que no decide nada, o cerrarla con su flecha de atrás.
    const app = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-app]",
    )?.dataset;
    if (app) {
      if (!engine.isEnding) {
        setViewedAppNode(undefined);
        const appDef = apps?.find((a) => a.texto === app.app);
        setAppOpen(
          app.appRelleno && esRellenoTipo(app.appRelleno)
            ? {
                nombre: app.app ?? "",
                relleno: app.appRelleno,
                color: appDef?.color,
              }
            : app.appVacia
              ? {
                  nombre: app.app ?? "",
                  vacia: app.appVacia,
                  Icono: appDef?.Icono,
                  color: appDef?.color,
                }
              : undefined,
        );
      }
      return;
    }

    if (engine.isEnding) return;

    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-hotspot-goto]",
    );
    if (!target) {
      if (
        phoneSimulation &&
        soundEnabled &&
        !reviewScreen &&
        (event.target as HTMLElement).closest("[data-filler-option]")
      ) {
        const now = Date.now();
        if (now - lastFillerTap.current >= 300) {
          lastFillerTap.current = now;
          playFillerTap();
        }
      }
      // Los controles del propio aparato (nota de voz, silenciar llamada) sí
      // responden sin decidir nada.
      const control = (event.target as HTMLElement).closest("[data-control]");
      if (!showSideChoices && !control) setClickedEmptySpace(true);
      return;
    }

    // Si una respuesta del chat abre otra app, el retorno declarado por esa
    // pantalla es el hilo que quedó después de enviar, aunque no se haya visto.
    const destinationView = story[target.dataset.hotspotGoto ?? ""]?.view;
    if (toView.kind === "sms" && destinationView?.kind === "web") {
      const returnNode = destinationView.cerrarGoto;
      if (returnNode && story[returnNode]?.view.kind === "sms") {
        setThreads((previous) => ({ ...previous, sms: returnNode }));
      }
    }

    // No puede dejarse al efecto que limpia pestanaMirada al cambiar de nodo:
    // si el destino es el nodo actual, el nodo no cambia y ese efecto no corre.
    setAppOpen(undefined);
    setViewedAppNode(undefined);
    setViewedThread(undefined);
    setViewedTab(undefined);

    // Volver a la pantalla en la que ya estás no es una decisión (evita n3→n3).
    if (target.dataset.hotspotGoto !== engine.current) {
      handleHotspotClick(event, engine.choose);
    }
  };

  const decision = engine.isEnding ? (
    <VerdictPanel
      estadoGuardado={engine.runStatus}
      escenarioId={scenarioId}
      node={engine.node}
      senales={engine.node.senales ?? signals}
      regla={rule}
      restartLabel={restartLabel}
      onRestart={restart}
      contenedorId="pantalla-escenario"
      onPantalla={setReviewScreen}
    />
  ) : (
    (() => {
      const questionBlock = (
        <div className="grid gap-3">
          <p className="text-lg font-semibold text-ink">{question}</p>
          {showSideChoices && engine.node.choices && (
            <StoryChoices
              choices={engine.node.choices}
              onChoose={engine.choose}
            />
          )}
          <Instructions
            pista={helpClue}
            cuandoTermina={onFinished}
            fallo={!hideEmptyClickNotice && clickedEmptySpace}
          >
            {showSideChoices ? undefined : instruction}
          </Instructions>
        </div>
      );

      return (
        <div className="grid gap-4">
          {referencePanel}
          {/* Sin tarjeta propia: "¿Qué haces?" se ve igual que en el resto de módulos. */}
          {questionBlock}
        </div>
      );
    })()
  );

  const appAccent = appOpen
    ? appOpen.color
    : toView.kind === "web" && toView.app
      ? toView.appAccent
      : undefined;
  const appAccentStyle = appAccent
    ? ({ "--app-accent": appAccent } as CSSProperties)
    : undefined;

  // La cabecera de una app lleva color; la del navegador con dirección, los
  // mensajes y las llamadas son claras, y la barra de estado las acompaña.
  const headerIsColored =
    !engine.isEnding &&
    (Boolean(appOpen) || (toView.kind === "web" && Boolean(toView.app)));

  const phoneScreen = (
    <div className={styles.phoneStage} onClick={onHotspot}>
      <div className={styles.phoneBody}>
        {showNotification && nodeNotification && (
          <PhoneNotification
            notificacion={nodeNotification}
            onDescartar={() => setDiscarded((ids) => [...ids, engine.current])}
          />
        )}
        {/* El color de la app va en una variable y no solo en la cabecera:
            el botón principal y los realces lo heredan, para que la cabecera
            de un banco y su botón no salgan de dos marcas distintas. */}
        <div className={styles.phoneApp} style={appAccentStyle}>
          {/* Va dentro de la app y con el color de su cabecera: en un teléfono
              real la barra de estado y el título de la app son una sola franja. */}
          <div
            className={`${styles.phoneStatusBar} ${
              headerIsColored ? styles.phoneStatusBarApp : styles.phoneStatusBarClaro
            }`}
            aria-hidden
          >
            <span>{phoneTime}</span>
            <span className={styles.phoneCamera} />
            <span className={styles.phoneSensors}>
              <svg viewBox="0 0 16 12" className={styles.phoneSignal} fill="currentColor">
                <rect x="0" y="8" width="2.4" height="4" rx="0.8" />
                <rect x="4.2" y="5.5" width="2.4" height="6.5" rx="0.8" />
                <rect x="8.4" y="3" width="2.4" height="9" rx="0.8" />
                <rect x="12.6" y="0" width="2.4" height="12" rx="0.8" />
              </svg>
              <span>5G</span>
              <span className={styles.phoneBattery}></span>
            </span>
          </div>
          {appOpen && !engine.isEnding ? (
            <>
              <div className={styles.phoneAppBar}>
                <button
                  type="button"
                  className={`${styles.hotspot} ${styles.phoneAppVolver}`}
                  aria-label={
                    toView.kind === "call"
                      ? "Volver a la llamada"
                      : "Volver al hilo de mensajes"
                  }
                  data-app=""
                >
                  <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                </button>
                <span className={styles.phoneAppBarNombre}>
                  {appOpen.nombre}
                </span>
                <span className={styles.phoneAppVolver} aria-hidden />
              </div>
              <div
                className={styles.phoneViewport}
                data-filler-option={
                  "relleno" in appOpen && appOpen.relleno === "navegador" ? undefined : ""
                }
              >
                {"relleno" in appOpen ? (
                  <AppRelleno tipo={appOpen.relleno} color={appOpen.color} />
                ) : (
                  <div className={styles.appVacia}>
                    {appOpen.Icono && (
                      <span
                        className={styles.appVaciaIcono}
                        style={
                          appOpen.color
                            ? { background: appOpen.color }
                            : undefined
                        }
                        aria-hidden
                      >
                        <appOpen.Icono
                          className={styles.appVaciaGlifo}
                          strokeWidth={1.75}
                        />
                      </span>
                    )}
                    <p className={styles.appVaciaTexto}>{appOpen.vacia}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {toView.kind === "web" &&
                (toView.app ? (
                  // Una app no tiene barra de direcciones: no hay dominio que
                  // comprobar porque no se llegó por un enlace.
                  <div className={styles.phoneAppBar}>
                    {/* Salir es a veces la decisión (colgar una llamada). */}
                    {viewedAppNode ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Salir de la aplicación"
                        data-close-app
                      >
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </button>
                    ) : toView.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Salir de la aplicación"
                        data-hotspot-goto={toView.cerrarGoto}
                        data-hotspot-label={toView.cerrarLabel}
                      >
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </button>
                    ) : (
                      <span className={styles.phoneBrowserControl} aria-hidden>
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </span>
                    )}
                    <span className={styles.phoneAppBarNombre}>
                      {toView.app}
                    </span>
                    <span className={styles.phoneAppBarPlaceholder} aria-hidden />
                  </div>
                ) : (
                  <div
                    className={styles.phoneBrowserBar}
                    data-signal={toView.senalUrl}
                  >
                    {/* Sin pestaña que cerrar, salir es la flecha de atrás. */}
                    {viewedAppNode ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Volver atrás"
                        data-close-app
                      >
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </button>
                    ) : toView.cerrarGoto ? (
                      <button
                        type="button"
                        className={`${styles.hotspot} ${styles.phoneBrowserControl}`}
                        aria-label="Volver atrás"
                        data-hotspot-goto={toView.cerrarGoto}
                        data-hotspot-label={toView.cerrarLabel}
                      >
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </button>
                    ) : (
                      <span className={styles.phoneBrowserControl} aria-hidden>
                        <ChevronLeft aria-hidden className={styles.phoneChevron} strokeWidth={2.25} />
                      </span>
                    )}
                    <span className={styles.phoneBrowserUrl}>
                      {/* El indicador de seguridad es justo lo que el módulo enseña a leer. */}
                      {toView.secure ? (
                        <Lock
                          aria-label="Conexión segura"
                          className={`${styles.phoneBrowserSecurity} ${styles.phoneBrowserSafe}`}
                          strokeWidth={2.25}
                        />
                      ) : (
                        <span className={styles.phoneBrowserUnsafe}>
                          <TriangleAlert
                            aria-hidden
                            className={styles.phoneBrowserSecurity}
                            strokeWidth={2.25}
                          />
                        </span>
                      )}
                      <span className={styles.phoneBrowserAddress}>
                        {mobileUrl(toView.url)}
                      </span>
                    </span>
                    <span className={styles.phoneBrowserControl} aria-hidden>
                      <EllipsisVertical className={styles.phoneChevron} strokeWidth={2.25} />
                    </span>
                  </div>
                ))}
              <div className={styles.phoneViewport}>
                <DeviceScreen
                  view={toView}
                  acciones={emailActions}
                  carpetas={folders}
                  destinatario={recipient}
                  carpetaForzada={reviewScreen ? "Recibidos" : undefined}
                  terminada={engine.isEnding}
                  heardLines={heardLines.current}
                  guiaCorreo={emailGuide}
                  guiaCorreoTarget={
                    guideVisible ? activeGuideStep?.targetId : undefined
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Siempre visible: en varios escenarios entrar por tu cuenta al dock es
          el único camino al acierto. */}
      {apps && apps.length > 0 && (
        <div className={styles.phoneDock} aria-label="Apps del teléfono">
          {apps.map(
            ({
              Icono: Icon,
              texto: text,
              viewNode,
              viewNodeEnLlamada,
              viewNodeSinLlamada,
              goto,
              gotoEnLlamada,
              label,
              vacia: empty,
              relleno,
              color,
              hilo: thread,
            }) => {
              // El marcador no cuenta como llamada: tocar un número no es haber llamado.
              // Las capas visuales pueden mostrar SMS u otra app mientras la
              // historia sigue en una llamada. La variante depende del nodo
              // narrativo, no de la pantalla que momentáneamente lo tapa.
              const onCall =
                engine.node.view.kind === "call" && !engine.node.view.marcando;
              const visualDestination =
                (onCall && viewNodeEnLlamada) ||
                viewNode ||
                (!callInProgress ? viewNodeSinLlamada : undefined);
              const decisionDestination = (onCall && gotoEnLlamada) || goto;
              const filler = empty || relleno;
              return (
                <button
                  key={text}
                  type="button"
                  className={styles.phoneDockApp}
                  data-app-view={visualDestination}
                  data-hotspot-goto={decisionDestination}
                  data-hotspot-label={label}
                  // Las que no deciden se abren igual (ver AppTelefono).
                  data-app={
                    visualDestination || decisionDestination || !filler
                      ? undefined
                      : text
                  }
                  data-app-vacia={
                    visualDestination || decisionDestination ? undefined : empty
                  }
                  data-app-relleno={
                    visualDestination || decisionDestination
                      ? undefined
                      : relleno
                  }
                  data-app-hilo={
                    visualDestination || decisionDestination || filler
                      ? undefined
                      : (thread ?? "")
                  }
                >
                  <span
                    className={styles.phoneDockIcono}
                    style={color ? { background: color } : undefined}
                  >
                    <Icon
                      aria-hidden
                      className={styles.phoneDockGlifo}
                      strokeWidth={2}
                    />
                  </span>
                  <span className={styles.phoneDockNombre}>{text}</span>
                </button>
              );
            },
          )}
        </div>
      )}

      <div className={styles.phoneSystemBar} aria-hidden>
        <span></span>
      </div>
    </div>
  );

  return (
    <ScenarioLayout
      escenarioId={scenarioId}
      resumen={summary}
      contexto={context}
      nota={note}
      dominioCorreo={emailDomain}
      pantalla={
        phoneSimulation ? (
          phoneScreen
        ) : !chatInBrowser &&
          (toView.kind === "sms" || toView.kind === "escena") ? (
          <div // NOSONAR: delega el clic a los <button>/<a> nativos que contiene, que ya manejan teclado
            className="contents"
            onClick={onHotspot}
          >
            <DeviceScreen
              view={toView}
              acciones={emailActions}
              carpetas={folders}
              destinatario={recipient}
              terminada={engine.isEnding}
              heardLines={heardLines.current}
              guiaCorreo={emailGuide}
              guiaCorreoTarget={
                guideVisible ? activeGuideStep?.targetId : undefined
              }
            />
          </div>
        ) : (
          <Browser
            pestanas={tabs}
            abiertas={visible}
            activa={active}
            marcadores={markers ?? []}
            reloj={clock}
            onHotspot={onHotspot}
          >
            <DeviceScreen
              view={toView}
              acciones={emailActions}
              carpetas={folders}
              destinatario={recipient}
              carpetaForzada={reviewScreen ? "Recibidos" : undefined}
              terminada={engine.isEnding}
              heardLines={heardLines.current}
              guiaCorreo={emailGuide}
              guiaCorreoTarget={
                guideVisible ? activeGuideStep?.targetId : undefined
              }
            />
          </Browser>
        )
      }
      identidad={identity}
      decision={decision}
      ocultarDecision={hideDecision && !engine.isEnding}
      resultado={engine.resultado}
      onEmpezar={restart}
      // El correo y la web se abren más en computador que en celular; el SMS
      // se queda en celular, que es donde de verdad llegan los mensajes.
      dispositivo={
        toView.kind === "escena"
          ? "escena"
          : !chatInBrowser && (screenActions || toView.kind === "sms")
            ? "telefono"
            : "escritorio"
      }
    />
  );
}

export default ScenarioStory;
