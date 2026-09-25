import type { ReactNode } from "react";
import { Link } from "react-router";
import LegalPage, { type LegalSection } from "../components/LegalPage";
import { CONTACTS, DEGREE, INSTITUTION, PROJECT_TITLE } from "../data/project";

// Fecha fija de la versión vigente: se cambia a mano al editar el texto.
// Nunca `new Date()`: la política no cambia sola cada día.
const LAST_UPDATED = "25 de septiembre de 2026";

interface DataItem {
  data: string;
  purpose: string;
  storage: string;
}

const COLLECTED_DATA: DataItem[] = [
  {
    data: "Nombre y apellido",
    purpose:
      "Que puedas reconocer tu cuenta y que tu nombre aparezca en tu certificado.",
    storage: "Cifrados en la base de datos (AES-256-GCM).",
  },
  {
    data: "Correo electrónico",
    purpose: "Iniciar sesión y enviarte tu certificado.",
    storage:
      "Cifrado en la base de datos. Para buscar tu cuenta se usa una huella (HMAC) que no permite recuperar el correo.",
  },
  {
    data: "Número de cédula",
    purpose: "Evitar que una misma persona cree dos cuentas.",
    storage:
      "No se guarda. Se valida al registrarte y solo queda un código derivado (HMAC-SHA256 con clave secreta) del que no se puede reconstruir la cédula.",
  },
  {
    data: "Contraseña",
    purpose: "Proteger el acceso a tu cuenta.",
    storage:
      "Nunca se guarda tal cual: solo un hash bcrypt. Nadie del equipo puede verla.",
  },
  {
    data: "Resultados de los escenarios",
    purpose:
      "Tu avance, la aprobación de cada módulo y el análisis del estudio.",
    storage:
      "Escenario jugado, decisiones tomadas, final alcanzado, puntaje, tiempo empleado y fechas. Se guardan con un seudónimo, separados de tus datos personales.",
  },
  {
    data: "Datos de la cuenta",
    purpose: "Que la plataforma funcione.",
    storage:
      "Fecha de registro, rol, si ya viste la pantalla de bienvenida, si la cuenta está desactivada y reinicios de módulo.",
  },
  {
    data: "Datos del certificado",
    purpose: "Emitirlo y permitir que cualquiera compruebe que es auténtico.",
    storage:
      "Código único, fecha de emisión, horas, calificación y módulos cubiertos. No incluye tu nombre.",
  },
  {
    data: "Dirección IP",
    purpose:
      "Limitar intentos repetidos de inicio de sesión y registro, y proteger el servidor.",
    storage:
      "Se usa de forma técnica y temporal; no se asocia a los resultados del estudio.",
  },
];

function DataList({ items }: Readonly<{ items: DataItem[] }>) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          key={item.data}
          className="rounded-md border border-hairline bg-surface p-4"
        >
          <p className="font-semibold text-ink">{item.data}</p>
          <p className="mt-1">
            <span className="font-medium text-ink">Para qué: </span>
            {item.purpose}
          </p>
          <p className="mt-1">
            <span className="font-medium text-ink">Cómo se trata: </span>
            {item.storage}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Bullets({ children }: Readonly<{ children: ReactNode }>) {
  return <ul className="mt-3 list-disc space-y-2 pl-6">{children}</ul>;
}

function ContactEmails() {
  return (
    <ul className="mt-3 space-y-2">
      {CONTACTS.map(({ name, email }) => (
        <li key={email}>
          {name}:{" "}
          <a
            href={`mailto:${email}`}
            className="font-medium text-link underline"
          >
            {email}
          </a>
        </li>
      ))}
    </ul>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "proyecto-academico",
    title: "Un proyecto académico",
    body: (
      <>
        <p>
          SAFE-Web es el prototipo del Trabajo de Integración Curricular
          "{PROJECT_TITLE}", que sus autores desarrollan para obtener el título
          de {DEGREE} en la {INSTITUTION}.
        </p>
        <Bullets>
          <li>
            No es un servicio comercial: no vende productos, no muestra
            publicidad y no tiene fines de lucro.
          </li>
          <li>
            Lo mantiene un equipo de estudiantes, con recursos limitados. Se
            ofrece tal como está, sin garantía de disponibilidad continua.
          </li>
          <li>
            Estará en funcionamiento mientras dure el proyecto. Al concluir, la
            plataforma se retira y los datos personales se eliminan (ver
            "Cuánto tiempo conservamos tus datos").
          </li>
        </Bullets>
        <p className="mt-3">
          El uso de la plataforma se rige además por los{" "}
          <Link to="/terminos" className="font-medium text-link underline">
            términos de uso
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "responsables",
    title: "Responsables del tratamiento",
    body: (
      <p>
        Los responsables de tus datos personales son los autores del proyecto.
        Sus nombres y correos están en la sección "Contacto", al final de esta
        página.
      </p>
    ),
  },
  {
    id: "marco-legal",
    title: "Marco legal y base del tratamiento",
    body: (
      <>
        <p>
          Tratamos tus datos conforme a la Ley Orgánica de Protección de Datos
          Personales del Ecuador (LOPDP) y su Reglamento.
        </p>
        <p className="mt-3">
          La base del tratamiento es tu <strong>consentimiento</strong>, que das
          al marcar la casilla "Acepto los términos de uso y la política de
          datos" al registrarte. Participar es voluntario, y la portada y sus
          videos se pueden ver sin crear una cuenta.
        </p>
      </>
    ),
  },
  {
    id: "datos-recogidos",
    title: "Qué datos recogemos",
    body: (
      <>
        <p>
          Recogemos solo lo necesario para darte acceso, registrar tu
          entrenamiento y emitir tu certificado:
        </p>
        <DataList items={COLLECTED_DATA} />
        <p className="mt-4">
          <strong>No recogemos</strong> tu ubicación, contactos, fotografías,
          datos bancarios, datos de salud ni ningún otro dato sensible. Tampoco
          usamos herramientas de analítica, rastreo ni publicidad de terceros.
        </p>
        <p className="mt-3">
          Los escenarios son simulaciones: nada de lo que hagas en ellos llega a
          un banco, al SRI ni a ninguna entidad real. Aun así,{" "}
          <strong>no escribas datos reales</strong> (contraseñas, números de
          tarjeta, códigos) dentro de un escenario.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Para qué usamos tus datos",
    body: (
      <>
        <p>Usamos tus datos únicamente para:</p>
        <Bullets>
          <li>
            Crear tu cuenta, permitirte iniciar sesión y proteger su acceso.
          </li>
          <li>
            Guardar tu avance, habilitar los escenarios en orden y determinar si
            apruebas cada módulo.
          </li>
          <li>
            Emitir tu certificado, enviártelo por correo y permitir su
            verificación.
          </li>
          <li>
            Analizar, de forma seudonimizada, si el entrenamiento ayuda a
            reconocer fraudes, como parte del estudio académico.
          </li>
        </Bullets>
        <p className="mt-3">
          No usamos tus datos para enviarte publicidad, no los vendemos ni los
          cedemos, y no los usamos para ningún otro fin.
        </p>
      </>
    ),
  },
  {
    id: "investigacion",
    title: "Uso en la investigación",
    body: (
      <>
        <p>
          Para el estudio, tus resultados se identifican con un seudónimo (por
          ejemplo, "P001"), nunca con tu nombre, correo o cédula.
        </p>
        <p className="mt-3">
          Lo que se publique en el Trabajo de Integración Curricular serán
          siempre resultados <strong>agregados</strong> (porcentajes,
          promedios), nunca los de una persona concreta.
        </p>
      </>
    ),
  },
  {
    id: "acceso-terceros",
    title: "Quién puede ver tus datos",
    body: (
      <>
        <Bullets>
          <li>
            <strong>Tú</strong>, desde tu cuenta: tu avance, tu recorrido y tu
            certificado.
          </li>
          <li>
            <strong>Los autores del proyecto</strong>, para administrar las
            cuentas y analizar los resultados con seudónimo.
          </li>
          <li>
            <strong>Autoridades competentes</strong>, solo si lo exige la ley.
          </li>
        </Bullets>
        <p className="mt-4">
          Usamos dos servicios externos: <strong>Resend</strong>, para enviarte
          tu certificado por correo, y <strong>YouTube</strong>, para los videos
          de capacitación, que solo se conectan cuando pulsas reproducir.
        </p>
      </>
    ),
  },
  {
    id: "certificado",
    title: "Tu certificado y su verificación",
    body: (
      <>
        <p>
          Al aprobar los módulos requeridos puedes obtener un certificado en PDF
          con tu nombre completo, las horas del entrenamiento, tu calificación y
          un código único (por ejemplo, SW-XXXX-XXXX).
        </p>
        <p className="mt-3">
          Cualquier persona que tenga ese código puede comprobar si el
          certificado es válido. La página de verificación{" "}
          <strong>no muestra tu nombre ni ningún otro dato personal</strong>. Tú
          decides con quién compartes tu certificado.
        </p>
      </>
    ),
  },
  {
    id: "navegador",
    title: "Cookies",
    body: (
      <p>
        Solo usamos una cookie para mantener tu sesión abierta, y tu navegador
        recuerda tus preferencias (tema claro u oscuro, sonido). No usamos
        cookies de publicidad ni de seguimiento; por eso no verás un aviso de
        cookies.
      </p>
    ),
  },
  {
    id: "seguridad",
    title: "Cómo protegemos tus datos",
    body: (
      <>
        <p>
          Aplicamos medidas de seguridad razonables para un proyecto académico
          de este tamaño, entre ellas:
        </p>
        <Bullets>
          <li>Conexión cifrada (HTTPS) entre tu navegador y la plataforma.</li>
          <li>
            Nombre, apellido y correo cifrados en la base de datos; la cédula
            nunca se almacena.
          </li>
          <li>Contraseñas guardadas de forma que nadie puede leerlas.</li>
        </Bullets>
        <p className="mt-3">
          Si ocurriera un problema de seguridad que afecte tus datos, te lo
          informaremos.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    title: "Cuánto tiempo conservamos tus datos",
    body: (
      <Bullets>
        <li>
          <strong>Datos personales</strong>: mientras tu cuenta exista. Se
          eliminan si lo solicitas y, en todo caso, al concluir el Trabajo de
          Integración Curricular.
        </li>
        <li>
          <strong>Resultados con seudónimo</strong>: se conservan para la
          investigación. Una vez eliminada tu cuenta, ya no se pueden asociar
          contigo.
        </li>
        <li>
          <strong>Registro del certificado</strong> (sin tu nombre): se conserva
          para que el certificado siga siendo verificable, salvo que pidas
          revocarlo.
        </li>
      </Bullets>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    body: (
      <>
        <p>
          Puedes pedirnos, cuando quieras, ver qué datos tuyos tenemos,
          corregirlos, eliminarlos o retirar tu consentimiento. Si eliminas tu
          cuenta, también se revoca tu certificado.
        </p>
        <p className="mt-3">
          Para hacerlo, escríbenos a los correos de contacto{" "}
          <strong>desde el correo con el que te registraste</strong>, así
          sabemos que la cuenta es tuya. Es gratuito.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "Menores de edad",
    body: (
      <p>
        A partir de los 15 años puedes registrarte por ti mismo. Si tienes{" "}
        <strong>menos de 15 años</strong>, necesitas la autorización de tu
        madre, padre o representante legal antes de registrarte.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios a esta política",
    body: (
      <p>
        Si cambiamos esta política, actualizaremos la fecha que aparece al
        inicio de esta página. Si el cambio afecta qué datos recogemos o para
        qué los usamos, te pediremos de nuevo tu consentimiento.
      </p>
    ),
  },
  {
    id: "contacto",
    title: "Contacto",
    body: (
      <>
        <p>
          Para cualquier duda sobre esta política o sobre cómo tratamos tus
          datos, escribe a los autores del proyecto:
        </p>
        <ContactEmails />
      </>
    ),
  },
];

export default function DataPolicy() {
  return (
    <LegalPage
      title="Política de Datos"
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    >
      <p>
        Esta política explica, en lenguaje claro, qué datos personales recoge
        SAFE-Web, para qué, cómo los protegemos y qué derechos tienes sobre
        ellos. Léela antes de registrarte.
      </p>

      <aside
        className="rounded-lg border border-hairline-strong bg-surface p-5"
        aria-labelledby="resumen"
      >
        <h2 id="resumen" className="text-xl font-semibold text-ink">
          En resumen
        </h2>
        <Bullets>
          <li>
            Pedimos nombre, apellido, correo y cédula solo para darte acceso y
            emitir tu certificado.
          </li>
          <li>
            Tu cédula no se guarda, y tu nombre y correo se almacenan cifrados.
          </li>
          <li>
            Tus resultados se analizan con un seudónimo, nunca con tu nombre.
          </li>
          <li>
            No vendemos tus datos, no mostramos publicidad y no usamos
            rastreadores.
          </li>
          <li>
            Puedes pedir ver, corregir o eliminar tus datos cuando quieras.
          </li>
        </Bullets>
      </aside>
    </LegalPage>
  );
}
