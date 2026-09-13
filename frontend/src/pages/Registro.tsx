import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Campo";
import LoadingScreen from "../components/PantallaCarga";
import { useAuth } from "../context/AuthContext";
import { isEcuadorianId, normalizeEcuadorianId } from "../lib/cedula";

function Registration() {
  const { isAuthenticated, loading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [ecuadorianId, setEcuadorianId] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // "Tocado" y no "no vacío": un campo vacío también está por debajo del
  // mínimo, pero marcarlo en rojo antes de que el usuario haya escrito una
  // sola letra es regañar por adelantado. Se activa al salir del campo, no
  // en cada tecla, igual que ya hace la cédula con su propio criterio.
  const [nameTouched, setNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const NAME_MIN = 2;
  const NAME_MAX = 60;
  const PASSWORD_MIN = 8;
  const shortName = nameTouched && name.length > 0 && name.length < NAME_MIN;
  const shortLastName = lastNameTouched && lastName.length > 0 && lastName.length < NAME_MIN;

  // Solo letras (con tildes y ñ) y espacios entre palabras, y ningún espacio
  // al principio, al final, ni dos seguidos: lo mismo que "María José" tiene
  // y "nombre " o "nombre  José" no.
  // Duplicado a propósito de `register.dto.ts` (NOMBRE_PATRON): es el mismo
  // caso que la cédula, no el del dominio del correo — aquí sí hace falta la
  // regla en el cliente para el error antes de enviar.
  const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  const NAME_PATTERN_MESSAGE = "Solo se permiten letras y espacios entre palabras.";
  // En vivo y no al salir del campo: a diferencia de "muy corto" —que se
  // resuelve solo con seguir escribiendo, y por eso sí espera al blur para no
  // regañar a medio nombre—, un número o símbolo no se arregla solo. Que siga
  // ahí una tecla más tarde no es información nueva; avisar de inmediato sí
  // lo es. Una sola letra ya cumple el patrón (son "una o más letras"), así
  // que esto no compite con el aviso de mínimo: nunca se disparan los dos a
  // la vez por el mismo motivo.
  const invalidNamePattern = name.length > 0 && !NAME_PATTERN.test(name);
  const invalidLastNamePattern = lastName.length > 0 && !NAME_PATTERN.test(lastName);
  // Cerca del límite y no siempre: un contador pegado a un campo que recién
  // empieza a llenarse es ruido que nadie necesita todavía.
  const nameCounter =
    name.length >= NAME_MAX - 10 ? `${name.length}/${NAME_MAX}` : undefined;
  const lastNameCounter =
    lastName.length >= NAME_MAX - 10 ? `${lastName.length}/${NAME_MAX}` : undefined;

  // Forma, no dominio: qué dominios se aceptan lo decide `EsDominioPermitido`
  // en el backend (spec 2026-08-22) y esa lista solo tiene sentido mantenida
  // en un lugar. Repetirla aquí la duplicaría con el riesgo de que las dos
  // copias diverjan; esto solo atrapa el "se me olvidó la arroba" antes de
  // pagar el viaje al servidor.
  const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmail = emailTouched && email.length > 0 && !EMAIL_FORMAT.test(email);

  // Misma política que `register.dto.ts`: 8 caracteres, una mayúscula, un
  // número y un carácter especial. Repetida aquí a propósito —a diferencia
  // del dominio del correo, esta regla sí necesita reflejarse en el cliente
  // para el indicador de fortaleza en vivo, que no tiene ningún equivalente
  // en el servidor al que consultarle mientras se escribe.
  const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const invalidPassword =
    passwordTouched && password.length > 0 && !PASSWORD_POLICY.test(password);

  // Cuenta criterios cumplidos y no todo-o-nada: alguien que ya puso
  // mayúscula y número pero le falta el símbolo está más cerca de una buena
  // contraseña que alguien que recién empezó a escribir, y verlo moverse un
  // paso a la vez anima a completarla en vez de rendirse en el primer intento.
  const criteriaPassword = [
    password.length >= PASSWORD_MIN,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const passwordStrength =
    password.length === 0
      ? null
      : criteriaPassword <= 2
        ? { texto: "Débil", clase: "text-danger" }
        : criteriaPassword === 3
          ? { texto: "Media", clase: "text-warning" }
          : { texto: "Fuerte", clase: "text-success-ink" };

  // Solo se avisa de la cédula cuando ya está completa: marcarla en rojo
  // mientras la escribe convierte cada tecla en un reproche.
  const normalizedEcuadorianId = normalizeEcuadorianId(ecuadorianId);
  const invalidEcuadorianId =
    normalizedEcuadorianId.length === 10 && !isEcuadorianId(normalizedEcuadorianId);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    // El backend valida igual; esto solo evita un viaje al servidor.
    if (!isEcuadorianId(normalizedEcuadorianId)) {
      setError("Revisa tu número de cédula: son 10 dígitos.");
      return;
    }

    if (name.length < NAME_MIN || lastName.length < NAME_MIN) {
      setNameTouched(true);
      setLastNameTouched(true);
      setError(`El nombre y el apellido deben tener al menos ${NAME_MIN} caracteres.`);
      return;
    }

    if (!NAME_PATTERN.test(name) || !NAME_PATTERN.test(lastName)) {
      setNameTouched(true);
      setLastNameTouched(true);
      setError(`El nombre y el apellido solo pueden tener letras y espacios entre palabras.`);
      return;
    }

    if (!EMAIL_FORMAT.test(email)) {
      setEmailTouched(true);
      setError("El correo no tiene un formato válido.");
      return;
    }

    if (!PASSWORD_POLICY.test(password)) {
      setPasswordTouched(true);
      setError(
        `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres, una mayúscula, un número y un carácter especial.`,
      );
      return;
    }

    if (!acceptedPolicy) {
      setError("Debes aceptar la política de datos para continuar");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        nombre: name,
        apellido: lastName,
        email,
        cedula: normalizedEcuadorianId,
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
          <Field
            id="nombre"
            label="Nombre"
            value={name}
            onChange={setName}
            onBlur={() => setNameTouched(true)}
            autoComplete="given-name"
            placeholder="María"
            maxLength={NAME_MAX}
            ayuda={nameCounter}
            error={
              shortName
                ? `Debe tener al menos ${NAME_MIN} caracteres.`
                : invalidNamePattern
                  ? NAME_PATTERN_MESSAGE
                  : undefined
            }
          />
          <Field
            id="apellido"
            label="Apellido"
            value={lastName}
            onChange={setLastName}
            onBlur={() => setLastNameTouched(true)}
            autoComplete="family-name"
            placeholder="Pérez"
            maxLength={NAME_MAX}
            ayuda={lastNameCounter}
            error={
              shortLastName
                ? `Debe tener al menos ${NAME_MIN} caracteres.`
                : invalidLastNamePattern
                  ? NAME_PATTERN_MESSAGE
                  : undefined
            }
          />
        </div>
        <Field
          id="cedula"
          label="Cédula"
          value={ecuadorianId}
          onChange={setEcuadorianId}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1710034065"
          maxLength={13}
          error={
            invalidEcuadorianId ? "Ese número de cédula no es válido." : undefined
          }
        />
        <Field
          id="email"
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setEmailTouched(true)}
          autoComplete="email"
          placeholder="tu@correo.com"
          maxLength={120}
          error={invalidEmail ? "El correo no tiene un formato válido." : undefined}
        />
        <div>
          <Field
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            onBlur={() => setPasswordTouched(true)}
            autoComplete="new-password"
            maxLength={128}
            ayuda={`Al menos ${PASSWORD_MIN} caracteres, una mayúscula, un número y un carácter especial.`}
            error={
              invalidPassword
                ? `No cumple los requisitos: al menos ${PASSWORD_MIN} caracteres, una mayúscula, un número y un carácter especial.`
                : undefined
            }
          />
          {/* En vivo y no al salir del campo: a diferencia del error, que
              espera a que termine de escribir, la fortaleza se lee mejor como
              algo que responde tecla a tecla. */}
          {passwordStrength && (
            <p className={`mt-1.5 text-sm font-medium ${passwordStrength.clase}`}>
              Fortaleza de la contraseña: {passwordStrength.texto}
            </p>
          )}
        </div>

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

export default Registration;
