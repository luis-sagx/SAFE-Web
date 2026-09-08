import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import Campo from "../components/Campo";
import PantallaCarga from "../components/PantallaCarga";
import { useAuth } from "../context/AuthContext";
import { esCedulaEcuatoriana, normalizarCedula } from "../lib/cedula";

function Registro() {
  const { isAuthenticated, loading, register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // "Tocado" y no "no vacío": un campo vacío también está por debajo del
  // mínimo, pero marcarlo en rojo antes de que el usuario haya escrito una
  // sola letra es regañar por adelantado. Se activa al salir del campo, no
  // en cada tecla, igual que ya hace la cédula con su propio criterio.
  const [nombreTocado, setNombreTocado] = useState(false);
  const [apellidoTocado, setApellidoTocado] = useState(false);
  const [emailTocado, setEmailTocado] = useState(false);
  const [passwordTocado, setPasswordTocado] = useState(false);

  const NOMBRE_MIN = 2;
  const NOMBRE_MAX = 60;
  const PASSWORD_MIN = 8;
  const nombreCorto = nombreTocado && nombre.length > 0 && nombre.length < NOMBRE_MIN;
  const apellidoCorto = apellidoTocado && apellido.length > 0 && apellido.length < NOMBRE_MIN;
  // Cerca del límite y no siempre: un contador pegado a un campo que recién
  // empieza a llenarse es ruido que nadie necesita todavía.
  const contadorNombre =
    nombre.length >= NOMBRE_MAX - 10 ? `${nombre.length}/${NOMBRE_MAX}` : undefined;
  const contadorApellido =
    apellido.length >= NOMBRE_MAX - 10 ? `${apellido.length}/${NOMBRE_MAX}` : undefined;

  // Forma, no dominio: qué dominios se aceptan lo decide `EsDominioPermitido`
  // en el backend (spec 2026-08-22) y esa lista solo tiene sentido mantenida
  // en un lugar. Repetirla aquí la duplicaría con el riesgo de que las dos
  // copias diverjan; esto solo atrapa el "se me olvidó la arroba" antes de
  // pagar el viaje al servidor.
  const EMAIL_FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalido = emailTocado && email.length > 0 && !EMAIL_FORMATO.test(email);
  const passwordCorta =
    passwordTocado && password.length > 0 && password.length < PASSWORD_MIN;

  // Solo se avisa de la cédula cuando ya está completa: marcarla en rojo
  // mientras la escribe convierte cada tecla en un reproche.
  const cedulaLimpia = normalizarCedula(cedula);
  const cedulaInvalida =
    cedulaLimpia.length === 10 && !esCedulaEcuatoriana(cedulaLimpia);

  if (loading) {
    return <PantallaCarga />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    // El backend valida igual; esto solo evita un viaje al servidor.
    if (!esCedulaEcuatoriana(cedulaLimpia)) {
      setError("Revisa tu número de cédula: son 10 dígitos.");
      return;
    }

    if (nombre.length < NOMBRE_MIN || apellido.length < NOMBRE_MIN) {
      setNombreTocado(true);
      setApellidoTocado(true);
      setError(`El nombre y el apellido deben tener al menos ${NOMBRE_MIN} caracteres.`);
      return;
    }

    if (!EMAIL_FORMATO.test(email)) {
      setEmailTocado(true);
      setError("El correo no tiene un formato válido.");
      return;
    }

    if (password.length < PASSWORD_MIN) {
      setPasswordTocado(true);
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
      return;
    }

    if (!acceptedPolicy) {
      setError("Debes aceptar la política de datos para continuar");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        nombre,
        apellido,
        email,
        cedula: cedulaLimpia,
        password,
      });
      navigate("/dashboard");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Solo para darte acceso. Tus resultados se analizan de forma anónima."
      pie={
        <p className="mt-6 text-base text-body">
          ¿Ya tienes cuenta?{" "}
          <Link to="/" className="font-medium text-link underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="nombre"
            label="Nombre"
            value={nombre}
            onChange={setNombre}
            onBlur={() => setNombreTocado(true)}
            autoComplete="given-name"
            placeholder="María"
            maxLength={NOMBRE_MAX}
            ayuda={contadorNombre}
            error={nombreCorto ? `Debe tener al menos ${NOMBRE_MIN} caracteres.` : undefined}
          />
          <Campo
            id="apellido"
            label="Apellido"
            value={apellido}
            onChange={setApellido}
            onBlur={() => setApellidoTocado(true)}
            autoComplete="family-name"
            placeholder="Pérez"
            maxLength={NOMBRE_MAX}
            ayuda={contadorApellido}
            error={apellidoCorto ? `Debe tener al menos ${NOMBRE_MIN} caracteres.` : undefined}
          />
        </div>
        <Campo
          id="cedula"
          label="Cédula"
          value={cedula}
          onChange={setCedula}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1710034065"
          maxLength={13}
          error={
            cedulaInvalida ? "Ese número de cédula no es válido." : undefined
          }
        />
        <Campo
          id="email"
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setEmailTocado(true)}
          autoComplete="email"
          placeholder="tu@correo.com"
          maxLength={120}
          error={emailInvalido ? "El correo no tiene un formato válido." : undefined}
        />
        <Campo
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          onBlur={() => setPasswordTocado(true)}
          autoComplete="new-password"
          maxLength={128}
          ayuda="Mínimo 8 caracteres."
          error={
            passwordCorta
              ? `Debe tener al menos ${PASSWORD_MIN} caracteres.`
              : undefined
          }
        />

        <div className="flex items-start gap-3">
          <input
            id="acceptPolicy"
            type="checkbox"
            checked={acceptedPolicy}
            onChange={(e) => setAcceptedPolicy(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-input bg-surface text-primary"
          />
          <label htmlFor="acceptPolicy" className="text-sm text-body">
            Acepto la{" "}
            <a
              href="/politica-de-datos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-link underline hover:text-link-active"
            >
              política de datos
            </a>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
        >
          {submitting ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Registro;
