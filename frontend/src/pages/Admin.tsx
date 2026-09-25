import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import {
  KeyRound,
  Loader2,
  Plus,
  Copy,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import AppHeader from "../components/AppHeader";
import ConfirmDialog, { type Confirmation } from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import {
  changeParticipantStatus,
  changeTrainerStatus,
  createTrainer,
  deleteParticipant,
  fetchParticipants,
  fetchResults,
  fetchTrainers,
  resetParticipantPassword,
  resetTrainerPassword,
  type AdminParticipant,
  type RunResult,
} from "../lib/api";

type Tab = "participantes" | "testers" | "resultados";

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
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchParticipants()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Toda acción sobre un participante pasa por el modal de confirmación.
  const toggleStatus = (p: AdminParticipant) =>
    setConfirmation({
      titulo: p.activo ? "¿Desactivar esta cuenta?" : "¿Activar esta cuenta?",
      mensaje: p.activo
        ? `${fullName(p)} no podrá iniciar sesión hasta que la reactives.`
        : `${fullName(p)} podrá volver a iniciar sesión.`,
      etiqueta: p.activo ? "Sí, desactivar" : "Sí, activar",
      Icono: p.activo ? UserX : UserCheck,
      accion: async () => {
        const updated = await changeParticipantStatus(p.id, !p.activo);
        setList((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      },
    });

  const reset = (p: AdminParticipant) =>
    setConfirmation({
      titulo: "¿Restablecer la contraseña?",
      mensaje: `Se generará una contraseña nueva para ${fullName(p)} y la actual dejará de funcionar.`,
      etiqueta: "Sí, restablecer",
      Icono: KeyRound,
      accion: async () => {
        const { password } = await resetParticipantPassword(p.id);
        setNewPassword(password);
      },
    });

  const removeParticipant = (p: AdminParticipant) =>
    setConfirmation({
      titulo: "¿Eliminar esta cuenta?",
      mensaje: `Se borrará la cuenta de ${fullName(p)}. Esta acción no se puede deshacer.`,
      etiqueta: "Sí, eliminar",
      Icono: Trash2,
      peligro: true,
      accion: async () => {
        await deleteParticipant(p.id);
        setList((prev) => prev.filter((x) => x.id !== p.id));
      },
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
                    <StatusPill active={p.activo} />
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">
                    {date(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(p)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong"
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
                        onClick={() => reset(p)}
                        title="Restablecer contraseña"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong"
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
                        onClick={() => removeParticipant(p)}
                        title="Eliminar cuenta"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/30 bg-surface px-2.5 text-xs font-medium text-danger transition hover:bg-danger/10"
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

      {confirmation && (
        <ConfirmDialog
          confirmation={confirmation}
          onClose={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}

const OUTCOME_LABEL: Record<string, string> = {
  CORRECTO: "Correcto",
  PARCIAL: "Parcial",
  INCORRECTO: "Incorrecto",
};

const INPUT_CLASS =
  "mt-1 block h-10 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-ink";

const EMPTY_TESTER = { nombre: "", apellido: "", email: "" };

/// Formulario de alta dentro de un modal. Al crear, el mismo modal pasa a
/// mostrar la contraseña inicial, que solo se ve esa vez.
function CreateTesterModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(EMPTY_TESTER);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await createTrainer(form);
      setPassword(created.password);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (password) {
    return (
      <Modal titulo="Tester creado" onClose={onClose}>
        <p className="mt-2 text-sm text-body">
          Entrega esta contraseña inicial por un canal seguro.
        </p>
        <div className="mt-4">
          <PasswordBanner password={password} onClose={onClose} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Crear tester" onClose={onClose} busy={submitting}>
      <p className="mt-1 text-sm text-body">
        La contraseña inicial se muestra una sola vez para entregarla por un canal seguro.
      </p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm font-medium text-ink">
          <span>Nombre</span>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="text-sm font-medium text-ink">
          <span>Apellido</span>
          <input
            required
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="text-sm font-medium text-ink sm:col-span-2">
          <span>Correo</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-md border border-hairline-strong bg-surface px-4 text-sm font-medium text-ink transition hover:bg-surface-strong disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
          >
            {submitting && (
              <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {submitting ? "Creando…" : "Crear tester"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-success/10 text-success-ink" : "bg-surface-strong text-muted"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${active ? "bg-success" : "bg-muted"}`}
      />
      {active ? "Activa" : "Desactivada"}
    </span>
  );
}

const ROW_BUTTON_CLASS =
  "inline-flex h-8 items-center gap-1 rounded-md border border-hairline-strong bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-surface-strong";

/// Los testers son cuentas de prueba (rol TRAINER en el backend): recorren
/// los escenarios sin contar para el estudio.
function Testers() {
  const [list, setList] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchTrainers()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const toggleStatus = (t: AdminParticipant) =>
    setConfirmation({
      titulo: t.activo ? "¿Desactivar este tester?" : "¿Activar este tester?",
      mensaje: t.activo
        ? `${fullName(t)} no podrá iniciar sesión hasta que lo reactives.`
        : `${fullName(t)} podrá volver a iniciar sesión.`,
      etiqueta: t.activo ? "Sí, desactivar" : "Sí, activar",
      Icono: t.activo ? UserX : UserCheck,
      accion: async () => {
        const updated = await changeTrainerStatus(t.id, !t.activo);
        setList((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      },
    });

  const reset = (t: AdminParticipant) =>
    setConfirmation({
      titulo: "¿Restablecer la contraseña?",
      mensaje: `Se generará una contraseña nueva para ${fullName(t)} y la actual dejará de funcionar.`,
      etiqueta: "Sí, restablecer",
      Icono: KeyRound,
      accion: async () => {
        const { password } = await resetTrainerPassword(t.id);
        setNewPassword(password);
      },
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-body">
          Cuentas para probar los escenarios. Sus corridas no cuentan para el estudio.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-on-primary transition hover:bg-primary-active"
        >
          <Plus aria-hidden className="size-4" strokeWidth={2} />
          Crear tester
        </button>
      </div>

      {newPassword && (
        <PasswordBanner password={newPassword} onClose={() => setNewPassword("")} />
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && (
        <p role="status" className="flex items-center gap-2 text-base text-muted">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Cargando testers…
        </p>
      )}
      {!loading && list.length === 0 && (
        <p className="text-base text-muted">Todavía no hay testers creados.</p>
      )}
      {!loading && list.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-hairline-strong">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft text-muted">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 text-ink">{fullName(t)}</td>
                  <td className="px-4 py-3 text-body">{t.email ?? "Sin correo"}</td>
                  <td className="px-4 py-3">
                    <StatusPill active={t.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => toggleStatus(t)} className={ROW_BUTTON_CLASS}>
                        {t.activo ? (
                          <UserX aria-hidden className="size-3.5" strokeWidth={1.75} />
                        ) : (
                          <UserCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
                        )}
                        {t.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => reset(t)}
                        title="Restablecer contraseña"
                        className={ROW_BUTTON_CLASS}
                      >
                        <KeyRound aria-hidden className="size-3.5" strokeWidth={1.75} />
                        Clave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateTesterModal onClose={() => setCreating(false)} onCreated={load} />
      )}
      {confirmation && (
        <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
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
  } else if (tab === "testers") {
    content = <Testers />;
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
            aria-selected={tab === "testers"}
            onClick={() => setTab("testers")}
            className={tabClassName(tab === "testers")}
          >
            Testers
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
