import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/BarraProgreso";
import Ticket, { Insignia, Notches, Sello } from "../components/Boleto";
import CertificateButton from "../components/CertificadoBoton";
import { TRAMA_FONDO } from "../components/TramaFondo";
import { Link } from "react-router";
import { getSectionScenarios, SECTIONS } from "../data/catalogo";
import { fetchAssessmentStatus, fetchProgress, fetchSusStatus, type AssessmentStatus, type Progress, type SusStatus } from "../lib/api";

// Solo secciones con escenarios tienen gating; las demás muestran "Pronto" sin pedir progreso.
const SECTIONS_ACTIVE = SECTIONS.filter(
  (s) => getSectionScenarios(s.id).length > 0,
);

// Secciones sin escenarios y módulos sin progreso quedan fuera del denominador: contarlos daría un avance que
// nadie puede mover hoy (sin escenarios) o nunca completar (sin umbral en el servidor).
function calculateOverallProgress(progressByModule: Record<string, Progress>) {
  let approved = 0;
  let total = 0;
  let required = 0;
  let approvedModules = 0;
  let modules = 0;

  for (const section of SECTIONS_ACTIVE) {
    const progress = progressByModule[section.id];
    if (!progress) continue;
    modules += 1;
    total += getSectionScenarios(section.id).length;
    approved += progress.aprobados;
    required += progress.requeridos;
    if (progress.aprobado) approvedModules += 1;
  }

  return {
    aprobados: approved,
    total,
    requeridos: required,
    modulosAprobados: approvedModules,
    modulos: modules,
  };
}

/** Folio del módulo, el mismo índice que imprime la portada: MOD-01…MOD-07. */
const folio = (index: number) => `MOD-${String(index + 1).padStart(2, "0")}`;

function Dashboard() {
  const { participant } = useAuth();
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null);
  const [assessmentError, setAssessmentError] = useState(false);
  const [assessmentRetry, setAssessmentRetry] = useState(0);
  const [susStatus, setSusStatus] = useState<SusStatus | null>(null);
  useEffect(() => {
    if (participant?.role !== 'PARTICIPANT') return;
    let cancelled = false;
    fetchAssessmentStatus().then(
      (status) => { if (!cancelled) setAssessmentStatus(status); },
      () => { if (!cancelled) setAssessmentError(true); },
    );
    return () => { cancelled = true; };
  }, [participant?.id, participant?.role, assessmentRetry]);
  useEffect(() => {
    if (participant?.role !== 'PARTICIPANT') return;
    let cancelled = false;
    fetchSusStatus().then(
      (status) => { if (!cancelled) setSusStatus(status); },
      () => { if (!cancelled) setSusStatus(null); },
    );
    return () => { cancelled = true; };
  }, [participant?.id, participant?.role]);
  const [progressByModule, setProgressByModule] = useState<
    Record<string, Progress>
  >({});

  useEffect(() => {
    let cancelled = false;

    // allSettled: un módulo sin umbral aún responde 404, y con Promise.all ese rechazo vaciaba el progreso de todos.
    void Promise.allSettled(SECTIONS_ACTIVE.map((s) => fetchProgress(s.id))).then(
      (results) => {
        if (cancelled) return;
        const loaded = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value);
        setProgressByModule(
          Object.fromEntries(loaded.map((p) => [p.modulo, p])),
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const global = calculateOverallProgress(progressByModule);
  const complete =
    global.modulos > 0 && global.modulosAprobados === global.modulos;
  // Primer módulo sin aprobar, solo entre los que ya respondieron: evita marcar "empieza aquí" antes de tiempo.
  const entry = SECTIONS_ACTIVE.find(
    (s) => progressByModule[s.id] && !progressByModule[s.id]?.aprobado,
  );

  return (
    <div className={`relative min-h-screen overflow-hidden bg-canvas ${TRAMA_FONDO}`}>
      <AppHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {assessmentStatus?.posttestAvailable && !assessmentStatus.posttestCompleted && (
          <section className="mb-8 rounded-lg border border-primary/30 bg-surface p-6 sm:p-8" aria-labelledby="final-assessment-title">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Último paso del estudio</p>
            <h2 id="final-assessment-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Completa tu evaluación final</h2>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-body">Gracias por completar los escenarios. Para cerrar tu participación en el estudio, responde la evaluación final. Tus respuestas nos ayudan a conocer qué cambió con el entrenamiento.</p>
            <Link to="/evaluacion-final" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-md bg-primary px-5 py-3 text-center text-base font-semibold text-on-primary hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto">
              <span>Responder evaluación final</span>
              <ArrowRight aria-hidden className="size-5 shrink-0" />
            </Link>
          </section>
        )}
        {/* Regla del curso, no promesa: antes decía que ninguna respuesta te deja mal y el resultado decía lo contrario. */}
        <p className="max-w-prose text-lg leading-relaxed text-body">
          Elige un tipo de engaño y enfréntate a una situación como las de todos
          los días. Puedes fallar y reiniciar el módulo completo en cualquier
          momento.
        </p>

        {assessmentStatus?.posttestCompleted && <p role="status" className="mt-6 text-body">Tu evaluación final ya está guardada.</p>}
        {assessmentError && <div className="mt-6"><p role="alert" className="text-danger">No pudimos comprobar si tu evaluación final está disponible.</p><button className="min-h-11 text-link underline" onClick={() => { setAssessmentError(false); setAssessmentRetry((value) => value + 1); }}>Reintentar evaluación</button></div>}

        {assessmentStatus?.posttestCompleted && susStatus?.available && (
          <section className="mb-8 rounded-lg border border-primary/30 bg-surface p-6 sm:p-8" aria-labelledby="sus-survey-title">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Último paso del estudio</p>
            {susStatus.completed ? (
              <>
                <h2 id="sus-survey-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Gracias por completar el estudio</h2>
                <p role="status" className="mt-3 max-w-prose text-base leading-relaxed text-body">Tu evaluación final y la encuesta de usabilidad ya están guardadas.</p>
                {complete && <CertificateButton />}
              </>
            ) : (
              <>
                <h2 id="sus-survey-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Cuéntanos cómo fue tu experiencia</h2>
                <p className="mt-3 max-w-prose text-base leading-relaxed text-body">Ya completaste la evaluación final. Responde la encuesta de usabilidad para terminar tu participación en el estudio.</p>
                <Link to="/encuesta-sus" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-md bg-primary px-5 py-3 text-center text-base font-semibold text-on-primary hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto">
                  <span>Responder encuesta de usabilidad</span>
                  <ArrowRight aria-hidden className="size-5 shrink-0" />
                </Link>
              </>
            )}
          </section>
        )}

        {/* Una tira de siete boletos perforada, no siete tarjetas sueltas: los módulos se recorren
            en orden, comparten el mismo papel y el talón guarda lo que te llevas (el certificado). */}
        <Ticket className="mt-8 overflow-hidden">
          {global.total > 0 && (
            <section
              aria-labelledby="titulo-global"
              className="relative border-b border-dashed border-ticket-edge px-6 py-5"
            >
              <Notches className="-bottom-2.5" />
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2
                  id="titulo-global"
                  className="font-mono text-base uppercase tracking-[0.12em] text-ink"
                >
                  Tu avance
                </h2>
                {/* Módulos primero y en grande: aprobar un módulo es la meta, no acumular escenarios. */}
                <p className="font-mono text-base uppercase tracking-[0.12em] text-muted">
                  <span className="text-xl text-ink tabular-nums">
                    {global.modulosAprobados}
                  </span>
                  <span>/{global.modulos}</span>{" "}
                  {global.modulos === 1
                    ? "módulo aprobado"
                    : "módulos aprobados"}
                  <span aria-hidden className="mx-3 text-ticket-edge">
                    |
                  </span>
                  <span className="text-ink tabular-nums">
                    {global.aprobados}
                  </span>
                  <span>/{global.total}</span> escenarios
                </p>
              </div>

              <ProgressBar
                className="mt-4"
                variante="continua"
                aprobados={global.aprobados}
                total={global.total}
                requeridos={global.requeridos || undefined}
                aprobado={complete}
                etiqueta="Avance del entrenamiento completo"
              />
            </section>
          )}

          <ul>
            {SECTIONS.map((section, index) => {
              const scenarios = getSectionScenarios(section.id);
              const available = scenarios.length > 0;
              const progress = progressByModule[section.id];
              const isEntry = section.id === entry?.id;
              const started = (progress?.escenarios.length ?? 0) > 0;
              const Icon = section.Icono;

              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm uppercase tracking-[0.14em] text-muted">
                      <Icon
                        aria-hidden
                        className={`size-4 shrink-0 ${available ? "text-link" : "text-muted"}`}
                        strokeWidth={1.75}
                      />
                      <span className="text-ink">{folio(index)}</span>
                      <span>{section.canal}</span>
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl uppercase tracking-[0.02em] text-ink underline-offset-4 group-hover:underline">
                      {section.titulo}
                    </h2>
                    <p className="mt-1.5 text-base leading-relaxed text-body">
                      {section.descripcion}
                    </p>
                  </div>

                  <div className="shrink-0 sm:w-72">
                    {!available && <Sello>Pronto</Sello>}

                    {/* Única insignia: marca el primer módulo sin aprobar, el orden de entrada al recorrido. */}
                    {isEntry && (
                      <Insignia>
                        {started ? "Continúa aquí" : "Empieza aquí"}
                      </Insignia>
                    )}
                    {progress?.aprobado && (
                      <Sello tono="border-success-ink text-success-ink">
                        Aprobado
                      </Sello>
                    )}

                    {available && (
                      <p className="mt-2 font-mono text-sm uppercase tracking-[0.14em] text-muted">
                        {progress ? (
                          <>
                            <span className="text-ink tabular-nums">
                              {progress.aprobados}
                            </span>
                            <span>/{scenarios.length}</span> escenarios
                          </>
                        ) : (
                          `${scenarios.length} escenarios`
                        )}
                      </p>
                    )}

                    {progress && (
                      <ProgressBar
                        className="mt-2"
                        aprobados={progress.aprobados}
                        total={scenarios.length}
                        requeridos={progress.requeridos}
                        aprobado={progress.aprobado}
                        etiqueta={`Avance de ${section.titulo}`}
                      />
                    )}

                    {available && (
                      <span
                        aria-hidden
                        className="mt-2 inline-flex items-center gap-1.5 font-mono text-sm uppercase tracking-[0.14em] text-link transition group-hover:translate-x-0.5"
                      >
                        Abrir módulo
                        <ArrowRight className="size-4" strokeWidth={2} />
                      </span>
                    )}
                  </div>
                </>
              );

              // Se distinguen por sello y superficie, no por opacidad: bajarla dejaría el texto bajo el contraste mínimo.
              const rowClassName =
                "flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-8";

              return (
                <li
                  key={section.id}
                  className={`relative ${index > 0 ? "border-t border-dashed border-ticket-edge" : ""}`}
                >
                  {index > 0 && <Notches className="-top-2.5" />}

                  {available ? (
                    <Link
                      to={`/seccion/${section.id}`}
                      className={`group ${rowClassName} transition hover:bg-ticket-edge/15 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-link`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={`${rowClassName} bg-ticket-edge/25`}>
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Ticket>
      </main>
    </div>
  );
}

export default Dashboard;
