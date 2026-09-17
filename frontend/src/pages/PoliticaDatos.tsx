import type { ReactNode } from "react";
import { Link } from "react-router";

// Fecha fija de la versión vigente: se cambia a mano al editar el texto.
// Nunca `new Date()`: la política no cambia sola cada día.
const LAST_UPDATED = "16 de septiembre de 2026";

const CONTACTS = [
  { name: "Luis Sagnay", email: "luis@gmail.com" },
  { name: "Sebastián Parra", email: "sebas@gmail.com" },
];

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

const BROWSER_STORAGE: DataItem[] = [
  {
    data: "Cookie de sesión (mic-refresh-token)",
    purpose: "Mantener tu sesión abierta durante una jornada de entrenamiento.",
    storage:
      "Dura hasta 12 horas. Es httpOnly (el código de la página no puede leerla), solo se envía a la ruta de renovación de sesión y se borra al cerrar sesión.",
  },
  {
    data: "Token de acceso",
    purpose: "Autorizar cada acción que haces dentro de la plataforma.",
    storage:
      "En el almacenamiento local del navegador; caduca a los 15 minutos. No contiene tu nombre, correo ni cédula.",
  },
  {
    data: "Resultados pendientes de envío",
    purpose:
      "No perder un resultado si se corta la conexión al terminar un escenario.",
    storage:
      "En el almacenamiento local, solo hasta que el servidor lo recibe.",
  },
  {
    data: "Preferencia de tema",
    purpose: "Recordar si elegiste modo claro, oscuro o el del sistema.",
    storage: "En el almacenamiento local, sin vencimiento.",
  },
];

function DataList({ items }: { items: DataItem[] }) {
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

function Bullets({ children }: { children: ReactNode }) {
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

interface Section {
  id: string;
  title: string;
  body: ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "responsables",
    title: "Responsables del tratamiento",
    body: (
      <>
        <p>
          SAFE-Web es una plataforma de simulación de ciberamenazas desarrollada
          como Trabajo de Integración Curricular de la Carrera de Software de la
          Universidad de las Fuerzas Armadas ESPE. Los responsables de tus datos
          personales son sus autores:
        </p>
        <ContactEmails />
        <p className="mt-3">
          SAFE-Web no es una entidad comercial: no vende productos, no muestra
          publicidad y no tiene fines de lucro.
        </p>
      </>
    ),
  },
  {
    id: "marco-legal",
    title: "Marco legal y base del tratamiento",
    body: (
      <>
        <p>
          Tratamos tus datos conforme a la Ley Orgánica de Protección de Datos
          Personales del Ecuador (LOPDP, publicada en el Registro Oficial el 26
          de mayo de 2021) y su Reglamento.
        </p>
        <p className="mt-3">
          La base del tratamiento es tu <strong>consentimiento</strong>, que das
          al marcar la casilla "Acepto la política de datos" al registrarte.
          Participar es voluntario: puedes no registrarte o retirar tu
          consentimiento después (ver la sección "Cómo ejercer tus derechos").
          La portada pública y sus videos se pueden ver sin crear una cuenta.
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
          <li>
            Detectar y corregir fallas, y proteger la plataforma frente a
            abusos.
          </li>
        </Bullets>
        <p className="mt-3">
          No usamos tus datos para enviarte publicidad o boletines, no los
          vendemos ni los cedemos, y no los usamos para ningún fin distinto de
          los descritos aquí. Si alguna vez quisiéramos hacerlo, te pediríamos
          un nuevo consentimiento.
        </p>
      </>
    ),
  },
  {
    id: "investigacion",
    title: "Seudonimización y uso en la investigación",
    body: (
      <>
        <p>
          Tus resultados se identifican con un seudónimo (por ejemplo, "P001"),
          nunca con tu nombre, correo o cédula. Esa separación no depende solo
          de buenas prácticas, sino de cómo está construida la plataforma:
        </p>
        <Bullets>
          <li>
            Tus datos personales y tus resultados viven en dos servicios
            distintos, cada uno con su propio espacio y usuario en la base de
            datos.
          </li>
          <li>
            El servicio que guarda los resultados no tiene permiso para leer los
            datos personales.
          </li>
          <li>
            El equipo investigador consulta los resultados dentro de la
            plataforma, identificados solo por el seudónimo.
          </li>
        </Bullets>
        <p className="mt-3">
          El seudónimo sirve para relacionar tus resultados con el pre-test y el
          post-test del estudio, que se aplican fuera de esta plataforma (en
          Moodle). SAFE-Web no envía datos a Moodle ni recibe datos de Moodle.
        </p>
        <p className="mt-3">
          Los resultados que se publiquen en el Trabajo de Integración
          Curricular o en cualquier presentación académica serán siempre{" "}
          <strong>agregados</strong> (porcentajes, promedios, comparaciones
          entre grupos), nunca de una persona concreta.
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
            <strong>El equipo investigador</strong> (Luis Sagnay y Sebastián
            Parra), con una cuenta de supervisión: puede gestionar cuentas
            (activarlas, desactivarlas, restablecer la contraseña o
            eliminarlas), revocar certificados y ver los resultados
            seudonimizados.
          </li>
          <li>
            <strong>Autoridades competentes</strong>, solo si lo exige una orden
            o disposición legal.
          </li>
        </Bullets>
        <p className="mt-4">
          Además, estos proveedores tratan algunos datos en nuestro nombre, solo
          para el fin indicado:
        </p>
        <Bullets>
          <li>
            <strong>Resend</strong> (servicio de envío de correos, con
            servidores en Estados Unidos): recibe tu correo, tu nombre y el PDF
            de tu certificado para enviártelo. Es el único correo que te
            enviamos.
          </li>
          <li>
            <strong>YouTube (Google)</strong>: los videos de capacitación se
            muestran en modo de privacidad mejorada (youtube-nocookie.com) y el
            reproductor solo se carga cuando pulsas reproducir. Desde ese
            momento, Google recibe datos técnicos de tu navegador, como tu
            dirección IP, según su propia política de privacidad. Si no
            reproduces un video, no se conecta con YouTube.
          </li>
        </Bullets>
        <p className="mt-3">
          El envío a Resend y la conexión con YouTube implican una transferencia
          de datos fuera del Ecuador, que aceptas al dar tu consentimiento. La
          plataforma y su base de datos se alojan en un servidor administrado
          por el equipo investigador.
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
          Cualquier persona que tenga ese código puede comprobar en la página de
          verificación si el certificado es válido. Esa página muestra solo la
          fecha de emisión, las horas, la calificación y los módulos:{" "}
          <strong>no muestra tu nombre ni ningún otro dato personal</strong>. Tú
          decides con quién compartes tu certificado.
        </p>
      </>
    ),
  },
  {
    id: "navegador",
    title: "Cookies y almacenamiento en tu navegador",
    body: (
      <>
        <p>
          Solo usamos lo imprescindible para que la plataforma funcione. No
          usamos cookies de publicidad, de analítica ni de terceros:
        </p>
        <DataList items={BROWSER_STORAGE} />
        <p className="mt-4">
          Si usas un computador compartido, cierra sesión al terminar. Si borras
          los datos del navegador, se perderán los resultados que aún no se
          hayan enviado y tendrás que volver a iniciar sesión.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Cómo protegemos tus datos",
    body: (
      <>
        <Bullets>
          <li>Conexión cifrada (HTTPS) entre tu navegador y la plataforma.</li>
          <li>
            Nombre, apellido y correo cifrados en la base de datos; la cédula
            nunca se almacena.
          </li>
          <li>Contraseñas guardadas solo como hash bcrypt.</li>
          <li>
            Sesiones de corta duración y límite de intentos de inicio de sesión
            y registro.
          </li>
          <li>
            Mismo mensaje de error si el correo no existe o la contraseña es
            incorrecta, para que nadie pueda averiguar quién está registrado.
          </li>
          <li>
            Servicios aislados: la base de datos no es accesible desde Internet
            y cada servicio tiene solo los permisos que necesita.
          </li>
        </Bullets>
        <p className="mt-3">
          Ningún sistema es infalible. Si ocurriera un incidente de seguridad
          que afecte tus datos personales, lo notificaremos a la
          Superintendencia de Protección de Datos Personales y te informaremos a
          ti, en los plazos que establece la LOPDP, indicando qué pasó y qué
          medidas tomamos.
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
          <strong>Datos personales</strong> (nombre, apellido, correo, huella de
          la cédula y contraseña): mientras tu cuenta exista. Se eliminan si lo
          solicitas y, en todo caso, al concluir el Trabajo de Integración
          Curricular.
        </li>
        <li>
          <strong>Resultados seudonimizados</strong>: se conservan como datos de
          la investigación. Una vez eliminada tu cuenta, ya no es posible
          asociarlos con tu nombre, correo ni cédula.
        </li>
        <li>
          <strong>Registro del certificado</strong> (código, fecha, horas,
          calificación y módulos, sin tu nombre): se conserva para que el
          certificado siga siendo verificable, salvo que pidas revocarlo.
        </li>
        <li>
          <strong>Datos en tu navegador</strong>: según lo indicado en la
          sección de cookies y almacenamiento.
        </li>
      </Bullets>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    body: (
      <>
        <p>La LOPDP te reconoce, entre otros, los siguientes derechos:</p>
        <Bullets>
          <li>
            <strong>Información:</strong> saber quién trata tus datos, para qué
            y cómo (lo que explica esta página).
          </li>
          <li>
            <strong>Acceso:</strong> conocer qué datos tuyos tenemos.
          </li>
          <li>
            <strong>Rectificación y actualización:</strong> corregir datos
            inexactos o incompletos, por ejemplo un error en tu nombre antes de
            emitir el certificado.
          </li>
          <li>
            <strong>Eliminación:</strong> pedir que borremos tus datos
            personales.
          </li>
          <li>
            <strong>Oposición y suspensión del tratamiento:</strong> pedir que
            dejemos de usar tus datos, o que pausemos su uso mientras se
            resuelve una solicitud.
          </li>
          <li>
            <strong>Portabilidad:</strong> recibir tus datos en un formato
            estructurado y de uso común.
          </li>
          <li>
            <strong>No ser objeto de decisiones automatizadas</strong> que te
            afecten de forma significativa.
          </li>
          <li>
            <strong>Retirar tu consentimiento</strong> en cualquier momento.
          </li>
        </Bullets>
        <p className="mt-3">
          Sobre decisiones automatizadas: la plataforma decide de forma
          automática si apruebas un módulo y qué escenario se habilita después,
          a partir de tus respuestas. Esa decisión solo organiza tu
          entrenamiento; no tiene efectos legales ni económicos y puedes volver
          a intentar un módulo cuando quieras.
        </p>
      </>
    ),
  },
  {
    id: "ejercer-derechos",
    title: "Cómo ejercer tus derechos",
    body: (
      <>
        <ol className="mt-3 list-decimal space-y-2 pl-6">
          <li>
            Escribe a cualquiera de los correos de contacto con el asunto
            "Protección de datos – SAFE-Web".
          </li>
          <li>
            Envía el mensaje{" "}
            <strong>desde el correo con el que te registraste</strong>, para que
            podamos confirmar que la cuenta es tuya. Si ya no tienes acceso a
            ese correo, indícalo y te pediremos otra forma de verificación.
          </li>
          <li>
            Indica qué derecho quieres ejercer y, si aplica, qué dato debe
            corregirse.
          </li>
        </ol>
        <p className="mt-3">
          Responderemos en un plazo máximo de <strong>15 días</strong>. El
          trámite es gratuito.
        </p>
        <p className="mt-3">
          <strong>
            Si retiras tu consentimiento o pides eliminar tus datos
          </strong>
          , eliminamos tu cuenta y tus datos personales, y revocamos tu
          certificado si lo tenías. Tus resultados seudonimizados quedan sin
          vínculo con tu identidad; si además pides que se excluyan del estudio,
          los retiraremos del análisis siempre que este no haya concluido.
        </p>
        <p className="mt-3">
          Si no estás conforme con nuestra respuesta, puedes presentar un
          reclamo ante la{" "}
          <strong>Superintendencia de Protección de Datos Personales</strong>{" "}
          del Ecuador.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "Menores de edad",
    body: (
      <>
        <p>
          SAFE-Web está pensada también para adolescentes. Según el artículo 21
          de la LOPDP, a partir de los 15 años puedes dar tu consentimiento por
          ti mismo y ejercer tus derechos directamente.
        </p>
        <p className="mt-3">
          Si tienes <strong>menos de 15 años</strong>, necesitas la autorización
          de tu madre, padre o representante legal antes de registrarte, y es tu
          representante quien puede ejercer tus derechos en tu nombre. Si
          descubrimos que se registró una persona menor de 15 años sin esa
          autorización, eliminaremos su cuenta.
        </p>
      </>
    ),
  },
  {
    id: "cambios",
    title: "Cambios a esta política",
    body: (
      <p>
        Si cambiamos esta política, actualizaremos la fecha que aparece al
        inicio de esta página. Si el cambio afecta qué datos recogemos o para
        qué los usamos, lo avisaremos dentro de la plataforma y, cuando la ley
        lo requiera, te pediremos de nuevo tu consentimiento antes de aplicarlo.
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
          datos, escríbenos a:
        </p>
        <ContactEmails />
      </>
    ),
  },
];

export default function DataPolicy() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-11 items-center text-base font-medium text-link underline"
        >
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold text-ink">Política de Datos</h1>
        <p className="mt-3 text-base text-muted">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-10 text-base leading-relaxed text-body">
          <p>
            Esta política explica, en lenguaje claro, qué datos personales
            recoge SAFE-Web, para qué, cómo los protegemos, quién puede verlos y
            qué derechos tienes sobre ellos. Léela antes de registrarte.
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
                Pedimos nombre, apellido, correo y cédula solo para darte acceso
                y emitir tu certificado.
              </li>
              <li>
                Tu cédula no se guarda, y tu nombre y correo se almacenan
                cifrados.
              </li>
              <li>
                Tus resultados se analizan con un seudónimo, nunca con tu
                nombre.
              </li>
              <li>
                No vendemos tus datos, no mostramos publicidad y no usamos
                rastreadores.
              </li>
              <li>
                Puedes pedir acceso, corrección o eliminación de tus datos
                cuando quieras.
              </li>
            </Bullets>
          </aside>

          <nav aria-labelledby="indice">
            <h2 id="indice" className="text-xl font-semibold text-ink">
              Contenido
            </h2>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-11 items-center text-link underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {SECTIONS.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-titulo`}
              className="scroll-mt-6"
            >
              <h2
                id={`${section.id}-titulo`}
                className="mb-3 text-xl font-semibold text-ink"
              >
                {index + 1}. {section.title}
              </h2>
              {section.body}
            </section>
          ))}

          <p className="border-t border-hairline pt-6 text-sm text-muted">
            SAFE-Web · Versión vigente desde el {LAST_UPDATED}
          </p>
        </div>
      </div>
    </div>
  );
}
