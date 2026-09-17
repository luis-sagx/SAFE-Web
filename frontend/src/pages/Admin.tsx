import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  KeyRound,
  Loader2,
  Copy,
  Trash2,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import AppHeader from "../components/AppHeader";
import {
  changeParticipantStatus,
  changeTrainerStatus,
  createTrainer,
  deleteParticipant,
  fetchParticipants,
  fetchResults,
  fetchTrainers,
  resetParticipantPassword,
  type AdminParticipant,
  type RunResult,
} from "../lib/api";

type Tab = "participantes" | "formadores" | "resultados";

interface Confirmation {
  titulo: string;
  mensaje: string;
  /// Texto del botón que confirma ("Sí, desactivar").
  etiqueta: string;
  Icono: LucideIcon;
  /// true pinta el botón de confirmar en rojo (acción destructiva).
  peligro?: boolean;
  accion: () => void | Promise<void>;
}

function fullName(p: AdminParticipant): string {
  const parts = [p.nombre, p.apellido].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Sin nombre";
}

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/// Contraseña recién generada para un participante: se muestra una vez y el
/// supervisor la copia. El backend no la guarda en claro.
function PasswordBanner({
  password,
  onClose,
}: {
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline-strong bg-canvas-soft px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-body">
        <span>Contraseña nueva (cópiala ahora, no vuelve a mostrarse):</span>
        <code className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-ink">{password}</code>
        <button
          type="button"
          onClick={() => void copyPassword()}
          className="inline-flex items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2 py-1 text-xs font-medium text-ink transition hover:bg-surface-strong"
        >
          <Copy aria-hidden className="size-3.5" strokeWidth={1.75} />
          {copied ? "Copiada" : "Copiar contraseña"}
        </button>
      </div>
      <button type="button" onClick={onClose} className="text-sm font-medium text-link underline">
        Ya la copié, ocultar contraseña
      </button>
    </div>
  );
}

function Participants() {
  const [list, setList] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const dialogueRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchParticipants()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function withBlocking(id: string, action: () => Promise<void>) {
    setError("");
    setBusy(id);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /// Toda acción sobre un participante pasa por este modal antes de ejecutarse.
  function requestConfirmation(conf: Confirmation) {
    setConfirmation(conf);
    dialogueRef.current?.showModal();
  }

  const toggleStatus = (p: AdminParticipant) =>
    requestConfirmation({
      titulo: p.activo ? "¿Desactivar esta cuenta?" : "¿Activar esta cuenta?",
      mensaje: p.activo
        ? `${fullName(p)} no podrá iniciar sesión hasta que la reactives.`
        : `${fullName(p)} podrá volver a iniciar sesión.`,
      etiqueta: p.activo ? "Sí, desactivar" : "Sí, activar",
      Icono: p.activo ? UserX : UserCheck,
      accion: () =>
        withBlocking(p.id, async () => {
          const updated = await changeParticipantStatus(p.id, !p.activo);
          setList((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
        }),
    });

  const reset = (p: AdminParticipant) =>
    requestConfirmation({
      titulo: "¿Restablecer la contraseña?",
      mensaje: `Se generará una contraseña nueva para ${fullName(p)} y la actual dejará de funcionar.`,
      etiqueta: "Sí, restablecer",
      Icono: KeyRound,
      accion: () =>
        withBlocking(p.id, async () => {
          const { password } = await resetParticipantPassword(p.id);
          setNewPassword(password);
        }),
    });

  const removeParticipant = (p: AdminParticipant) =>
    requestConfirmation({
      titulo: "¿Eliminar esta cuenta?",
      mensaje: `Se borrará la cuenta de ${fullName(p)}. Esta acción no se puede deshacer.`,
      etiqueta: "Sí, eliminar",
      Icono: Trash2,
      peligro: true,
      accion: () =>
        withBlocking(p.id, async () => {
          await deleteParticipant(p.id);
          setList((prev) => prev.filter((x) => x.id !== p.id));
        }),
    });

  if (loading) {
    return <p role="status" className="flex items-center gap-2 text-base text-muted">
      <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      Cargando participantes…
    </p>;
  }

  return (
    <div>
      {newPassword && (
        <PasswordBanner
          password={newPassword}
          onClose={() => setNewPassword("")}
        />
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-base text-muted">
          Todavía no hay participantes registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline-strong">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft text-muted">
                <th className="px-4 py-3 font-semibold">Seudónimo</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-hairline last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-ink tabular-nums">
                    {p.seudonimo}
                  </td>
                  <td className="px-4 py-3 text-ink">{fullName(p)}</td>
                  <td className="px-4 py-3 text-body">{p.email ?? "Sin correo"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.activo
                          ? "bg-success/10 text-success-ink"
                          : "bg-surface-strong text-muted"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${p.activo ? "bg-success" : "bg-muted"}`}
                      />
                      {p.activo ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">
                    {date(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {busy === p.id && (
                        <Loader2
                          aria-hidden
                          className="size-4 animate-spin text-muted"
                        />
                      )}
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => toggleStatus(p)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
                      >
                        {p.activo ? (
                          <UserX aria-hidden className="size-3.5" strokeWidth={1.75} />
                        ) : (
                          <UserCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
                        )}
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => reset(p)}
                        title="Restablecer contraseña"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
                      >
                        <KeyRound
                          aria-hidden
                          className="size-3.5"
                          strokeWidth={1.75}
                        />
                        Clave
                      </button>
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => removeParticipant(p)}
                        title="Eliminar cuenta"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/30 bg-surface px-2.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
                      >
                        <Trash2
                          aria-hidden
                          className="size-3.5"
                          strokeWidth={1.75}
                        />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* <dialog> nativo: el navegador atrapa el foco, cierra con Escape y deja
          el fondo inerte. Toda acción sobre un participante confirma aquí. */}
      <dialog
        ref={dialogueRef}
        onClose={() => setConfirmation(null)}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-hairline-strong bg-surface p-6 text-ink shadow-card backdrop:bg-scrim"
      >
        {confirmation && (
          <>
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  confirmation.peligro
                    ? "bg-danger/10 text-danger"
                    : "bg-surface-strong text-ink"
                }`}
              >
                <confirmation.Icono className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink">
                  {confirmation.titulo}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-body">
                  {confirmation.mensaje}
                </p>
              </div>
            </div>
            <form method="dialog" className="mt-6 flex justify-end gap-2">
              {/* El foco arranca en Cancelar: la acción destructiva no se
                  confirma con un Enter reflejo. */}
              <button
                type="button"
                value="cancel"
                autoFocus
                className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong"
              >
                No, cancelar
              </button>
              <button
                type="button"
                value="confirm"
                onClick={() => void confirmation.accion()}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-on-primary transition ${
                  confirmation.peligro
                    ? "bg-danger hover:opacity-90"
                    : "bg-primary hover:bg-primary-active"
                }`}
              >
                <confirmation.Icono
                  aria-hidden
                  className="size-4"
                  strokeWidth={1.75}
                />
                {confirmation.etiqueta}
              </button>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}

const OUTCOME_LABEL: Record<string, string> = {
  CORRECTO: "Correcto",
  PARCIAL: "Parcial",
  INCORRECTO: "Incorrecto",
};

function Trainers() {
  const [list, setList] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "" });

  const load = useCallback(() => {
    setLoading(true);
    fetchTrainers()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPassword("");
    setSubmitting(true);
    try {
      const created = await createTrainer(form);
      setPassword(created.password);
      setForm({ nombre: "", apellido: "", email: "" });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(trainer: AdminParticipant) {
    setError("");
    try {
      const updated = await changeTrainerStatus(trainer.id, !trainer.activo);
      setList((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-hairline-strong bg-surface p-5">
        <h2 className="text-xl font-semibold text-ink">Crear capacitador</h2>
        <p className="mt-1 text-sm text-body">
          La contraseña inicial se muestra una sola vez para entregarla por un canal seguro.
        </p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="text-sm font-medium text-ink">
            <span>Nombre</span>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 block h-10 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-ink" />
          </label>
          <label className="text-sm font-medium text-ink">
            <span>Apellido</span>
            <input required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="mt-1 block h-10 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-ink" />
          </label>
          <label className="text-sm font-medium text-ink sm:col-span-2">
            <span>Correo</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block h-10 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-ink" />
          </label>
          <button type="submit" disabled={submitting} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-60 sm:w-fit">
            {submitting ? "Creando…" : "Crear capacitador"}
          </button>
        </form>
      </div>

      {password && <div className="mt-4"><PasswordBanner password={password} onClose={() => setPassword("")} /></div>}
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      <h2 className="mt-8 text-xl font-semibold text-ink">Capacitadores</h2>
      {loading && <output className="mt-3 block text-base text-muted">Cargando capacitadores…</output>}
      {!loading && list.length === 0 && <p className="mt-3 text-base text-muted">Todavía no hay capacitadores creados.</p>}
      {!loading && list.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-hairline-strong">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead><tr className="border-b border-hairline bg-canvas-soft text-muted"><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr></thead>
            <tbody>{list.map((trainer) => <tr key={trainer.id} className="border-b border-hairline last:border-0"><td className="px-4 py-3 text-ink">{fullName(trainer)}</td><td className="px-4 py-3 text-body">{trainer.email ?? "Sin correo"}</td><td className="px-4 py-3">{trainer.activo ? "Activo" : "Desactivado"}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => void toggle(trainer)} className="h-8 rounded-md border border-hairline-strong px-2.5 text-xs font-medium text-ink">{trainer.activo ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Results() {
  const [rows, setRows] = useState<RunResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults()
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p role="status" className="flex items-center gap-2 text-base text-muted">
      <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      Cargando resultados…
    </p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="text-base text-muted">
        Todavía no hay corridas registradas.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-body">
        {rows.length} corridas. Cada participante aparece solo por su seudónimo
        (P001…): ningún dato personal sale de aquí.
      </p>
      <div className="overflow-x-auto rounded-lg border border-hairline-strong">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-canvas-soft text-muted">
              <th className="px-4 py-3 font-semibold">Seudónimo</th>
              <th className="px-4 py-3 font-semibold">Escenario</th>
              <th className="px-4 py-3 font-semibold">Ver.</th>
              <th className="px-4 py-3 font-semibold">Resultado</th>
              <th className="px-4 py-3 font-semibold">Puntaje</th>
              <th className="px-4 py-3 font-semibold">Duración</th>
              <th className="px-4 py-3 font-semibold">Terminó</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.seudonimo}-${i}`}
                className="border-b border-hairline last:border-0"
              >
                <td className="px-4 py-3 font-medium text-ink tabular-nums">
                  {r.seudonimo}
                </td>
                <td className="px-4 py-3 text-body">{r.scenarioId}</td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {r.version}
                </td>
                <td className="px-4 py-3 text-body">
                  {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                </td>
                <td className="px-4 py-3 text-ink tabular-nums">{r.score}</td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {Math.round(r.durationMs / 1000)}s
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {date(r.finishedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Admin() {
  const [tab, setTab] = useState<Tab>("participantes");
  let content = <Results />;
  if (tab === "participantes") {
    content = <Participants />;
  } else if (tab === "formadores") {
    content = <Trainers />;
  }

  const tabClassName = (active: boolean) =>
    `h-9 rounded-md px-3 text-sm font-medium transition ${
      active ? "bg-surface-strong text-ink" : "text-body hover:bg-canvas-soft"
    }`;

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader etiqueta="Administración" />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Panel de administración
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Gestión del estudio
        </h1>

        <div
          className="mt-8 flex gap-1 border-b border-hairline pb-3"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "formadores"}
            onClick={() => setTab("formadores")}
            className={tabClassName(tab === "formadores")}
          >
            Capacitadores
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "participantes"}
            onClick={() => setTab("participantes")}
            className={tabClassName(tab === "participantes")}
          >
            Participantes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "resultados"}
            onClick={() => setTab("resultados")}
            className={tabClassName(tab === "resultados")}
          >
            Resultados
          </button>
        </div>

        <section className="mt-8">
          {content}
        </section>
      </main>
    </div>
  );
}

export default Admin;
