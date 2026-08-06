# Tres escenarios más a la mecánica interactiva — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `phishing/rol-de-pagos`, `phishing/quishing-actualice` y `phishing/sesion-bogota` de la mecánica de lista de opciones (`StoryEscenario`) a la mecánica interactiva de `phishing/factura-sri` (puntos reales sobre correo/navegador, sin lista de botones aparte).

**Architecture:** Cada escenario deja `StoryEscenario` y orquesta `useStoryEngine` + `EscenarioLayout` directo, con pantallas propias construidas a mano (como `FacturaSri.tsx`). El `Navegador` con pestañas se extrae primero a una pieza compartida (`components/ui/Navegador.tsx`) para que los tres lo reutilicen sin copiarlo. Sesión Bogotá suma una transición "misma pestaña" (sin pieza compartida nueva: es una rama más en la función `elegir()` de ese escenario).

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, CSS Modules (`DeviceScreen.module.css`, sin cambios).

## Global Constraints

- El contenido pedagógico (veredictos, `outcome`, señales, regla de oro) se conserva igual que en la versión de lista de opciones — solo cambia cómo se llega a cada final. Únicas excepciones de contenido, documentadas en la spec: la fusión de `e_preview` en `e_cierra` (Quishing) y la corrección de dos señales mal ancladas en Sesión Bogotá (ver Tarea 4, nota al final).
- Ningún elemento interactivo llama a `engine.choose` por su cuenta: todos llevan `data-hotspot-goto`/`data-hotspot-label` y el manejador delegado del contenedor de pantalla decide.
- Los 5 botones de la barra del correo (Responder/Reenviar/Archivar/Eliminar/Spam) se escriben bespoke por escenario — no se importa `barraDeCorreo.tsx` en ninguno de los tres.
- Cada escenario mantiene su propio test, equivalente a `FacturaSri.test.tsx`.
- `ClaveCaducada.tsx` y cualquier otro escenario en `StoryEscenario` no cambian de comportamiento.
- Spec de referencia: `docs/superpowers/specs/2026-08-05-escenarios-interactivos-phishing-design.md` (y la plantilla original en `docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md`).

---

## Task 1: Extraer `Navegador` a `components/ui/Navegador.tsx`

**Files:**
- Create: `frontend/src/components/ui/Navegador.tsx`
- Modify: `frontend/src/secciones/phishing/FacturaSri.tsx:1-467` (quita la función `Navegador` local y las constantes `PESTANAS`/`MARCADORES` pasan a construirse con los tipos importados; el resto del archivo no cambia)
- Test: `frontend/src/secciones/phishing/FacturaSri.test.tsx` (sin cambios de contenido — solo tiene que seguir pasando)

**Interfaces:**
- Produces: `Navegador` (componente), `PestanaConfig` (`{ titulo: string; url: string; segura: boolean; cierra?: string; senalUrl?: string }`), `MarcadorNavegador` (`{ Icono: LucideIcon; texto: string; goto?: string; label?: string }`), ambos exportados desde `components/ui/Navegador.tsx`. Las Tareas 2-4 los importan.

- [ ] **Step 1: Crear `components/ui/Navegador.tsx`**

```tsx
import { Globe, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Taskbar, Titlebar } from './DesktopChrome'
import styles from './DeviceScreen.module.css'

/**
 * El navegador con pestañas de los escenarios interactivos de phishing.
 * Extraído de FacturaSri.tsx (primer escenario en usar esta mecánica) para
 * que el resto de escenarios de correo/web lo reutilicen sin copiarlo. Ver
 * docs/superpowers/specs/2026-08-05-escenarios-interactivos-phishing-design.md
 * §2.1.
 */

export interface PestanaConfig {
  titulo: string
  url: string
  segura: boolean
  /** Nodo al que lleva cerrar esta pestaña. Si la pestaña decide su cierre en
   *  tiempo de ejecución (p. ej. según si se visitó otra pantalla antes), se
   *  deja sin definir aquí y se resuelve con `cierrePortal` +
   *  `pestanaCierreDinamico`. */
  cierra?: string
  /** `data-signal` para que el repaso de señales pueda resaltar la URL de
   *  esta pestaña. */
  senalUrl?: string
}

export interface MarcadorNavegador {
  Icono: LucideIcon
  texto: string
  /** Sin `goto` el marcador es decorativo: se ve pero no hace nada al
   *  pulsarlo, igual que los sitios de relleno de la barra de un navegador
   *  real. */
  goto?: string
  label?: string
}

interface NavegadorProps {
  /** Todas las pestañas que el escenario puede llegar a mostrar, por id de
   *  nodo del grafo. */
  pestanas: Record<string, PestanaConfig>
  /** Las que están abiertas ahora mismo, en el orden en que se abrieron. */
  abiertas: string[]
  activa: string
  marcadores: MarcadorNavegador[]
  /** Final al que lleva cerrar la pestaña marcada como `pestanaCierreDinamico`
   *  cuando esa pestaña no trae su propio `cierra` fijo. */
  cierrePortal?: string
  pestanaCierreDinamico?: string
  onHotspot: (event: React.MouseEvent) => void
  children: ReactNode
}

export function Navegador({
  pestanas,
  abiertas,
  activa,
  marcadores,
  cierrePortal,
  pestanaCierreDinamico,
  onHotspot,
  children,
}: NavegadorProps) {
  const actual = pestanas[activa]

  return (
    <section
      className={`${styles.screen} ${styles.desktop}`}
      aria-label="Navegador web"
      onClick={onHotspot}
    >
      <Titlebar texto="Navegador" />

      <div className={styles.tabstrip} role="tablist">
        {abiertas.map((id) => {
          const meta = pestanas[id]
          if (!meta) return null
          const esActiva = id === activa
          const cierra = id === pestanaCierreDinamico ? cierrePortal : meta.cierra

          return (
            <span
              key={id}
              className={`${styles.tab} ${esActiva ? '' : styles.tabInactiva}`}
              role="tab"
              aria-selected={esActiva}
              data-hotspot-goto={esActiva ? undefined : id}
              data-hotspot-label={`Cambió a la pestaña "${meta.titulo}"`}
            >
              <Globe aria-hidden className={styles.tabIcono} strokeWidth={1.75} />
              <span className={styles.tabTexto}>{meta.titulo}</span>
              {cierra && (
                <button
                  type="button"
                  className={styles.tabClose}
                  title={`Cerrar ${meta.titulo}`}
                  aria-label={`Cerrar la pestaña ${meta.titulo}`}
                  data-cierra={id}
                  data-hotspot-goto={cierra}
                  data-hotspot-label={`Cerró la pestaña "${meta.titulo}"`}
                >
                  ✕
                </button>
              )}
            </span>
          )
        })}
        <span className={styles.tabNueva} aria-hidden>
          +
        </span>
      </div>

      <div className={styles.urlbar}>
        {actual?.segura ? (
          <span className={styles.lock}>🔒</span>
        ) : (
          <span className={styles.warn}>⚠ No seguro</span>
        )}
        <span className={styles.url} data-signal={actual?.senalUrl}>
          {actual?.url}
        </span>
      </div>

      <div className={styles.marcadores}>
        {marcadores.map(({ Icono, texto, goto, label }) => (
          <button
            key={texto}
            type="button"
            className={styles.marcador}
            data-hotspot-goto={goto}
            data-hotspot-label={label}
          >
            <Icono aria-hidden className={styles.marcadorIcono} strokeWidth={1.75} />
            {texto}
          </button>
        ))}
      </div>

      {children}

      <Taskbar app="🌐 Navegador" reloj="vivo" />
    </section>
  )
}
```

- [ ] **Step 2: Actualizar `FacturaSri.tsx` para usar la pieza compartida**

Quita del archivo el import de `Titlebar, Taskbar` que ya no hacen falta directamente (el navegador los usa por dentro), la función `Navegador` completa (líneas 371-467 en la versión actual) y el tipo de `PESTANAS`/`MARCADORES`, y los reemplaza por el import y los tipos compartidos:

Reemplazar el bloque de imports (líneas 1-28):

```tsx
import {
  Archive,
  Building2,
  File,
  Forward,
  Landmark,
  Newspaper,
  Reply,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, EnlaceHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'
```

(`Globe` ya no hace falta: solo la usaba la función `Navegador` local, que se
borra en este mismo paso. `Titlebar`/`Taskbar` tampoco se importan más
aquí por la misma razón — los usa `Navegador` por dentro.)

Reemplazar la declaración de `PESTANAS` (antes tipada inline) por:

```tsx
const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Validación de comprobante',
    url: 'http://sri-facturacion-ec.com/validar-ruc',
    segura: false,
    cierra: 'n1',
    senalUrl: 'url-insegura',
  },
  n3: {
    titulo: 'SRI en Línea',
    url: 'https://srienlinea.sri.gob.ec/comprobantes',
    segura: true,
    senalUrl: 'url-real',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  { Icono: Building2, texto: 'SRI en Línea', goto: 'n3', label: 'Abrió el portal del SRI desde sus marcadores' },
  { Icono: Newspaper, texto: 'El Comercio' },
]
```

(Nota: el `MARCADORES` original resolvía el `goto` del portal con la prop `portal` dentro del propio `Navegador`; con la pieza compartida cada marcador declara su `goto`/`label` directamente, así que el `Building2` pasa a llevarlos explícitos.)

Borra por completo la función `Navegador` local (todo el bloque desde el comentario `/** \n * El navegador: ...` hasta su cierre `}`, justo antes de `function ContenidoCorreo`).

En `FacturaSri()`, donde se invoca `<Navegador ...>`, pasa las dos props nuevas:

```tsx
  const pantalla = (
    <Navegador
      pestanas={PESTANAS}
      abiertas={pestanas}
      activa={pantallaActual}
      marcadores={MARCADORES}
      cierrePortal={pestanas.includes('n2') ? 'e_dominio' : 'e_portal'}
      pestanaCierreDinamico="n3"
      onHotspot={onHotspot}
    >
```

(`abiertas` reemplaza el nombre de prop `pestanas` que tenía el componente local — el estado del componente sigue llamándose `pestanas` como hoy, solo cambia el nombre de la prop a la que se pasa.)

- [ ] **Step 3: Correr los tests de Factura SRI**

Run: `cd frontend && npx vitest run src/secciones/phishing/FacturaSri.test.tsx`
Expected: los 3 tests existentes en PASS, sin cambios de aserciones.

- [ ] **Step 4: Lint y typecheck**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/secciones/phishing/FacturaSri.tsx src/components/ui/Navegador.tsx`
Expected: sin errores. Si `Globe` u otro import quedó sin uso en `FacturaSri.tsx`, quitarlo del import.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Navegador.tsx frontend/src/secciones/phishing/FacturaSri.tsx
git commit -m "refactor(phishing): extract shared Navegador from FacturaSri"
```

---

## Task 2: Convertir Rol de pagos disponible

**Files:**
- Modify: `frontend/src/secciones/phishing/RolDePagos.tsx` (reescritura completa)
- Test: `frontend/src/secciones/phishing/RolDePagos.test.tsx` (nuevo)

**Interfaces:**
- Consumes: `Navegador`, `PestanaConfig`, `MarcadorNavegador` de `components/ui/Navegador` (Task 1); `CuerpoCorreo`, `AccionCorreo`, `CarpetaCorreo` de `components/ui/DesktopChrome`; `BotonHotspot`, `manejarClicHotspot` de `components/ui/interactivo`; `PanelVeredicto`, `Senal` de `components/ui/PanelVeredicto`; `useStoryEngine`, `Story`, `StoryNode` de `hooks/useStoryEngine`; `formatoHora` de `hooks/useRelojDelSistema`; `EscenarioLayout`.
- Produces: export default `RolDePagos`, sin cambios de firma pública (el catálogo lo sigue importando igual).

- [ ] **Step 1: Reescribir `RolDePagos.tsx` completo**

```tsx
import { Archive, Building2, Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },

  e_bien: {
    kind: 'good',
    verdict: 'Acertaste · el correo era legítimo',
    outcome:
      'Era un aviso real de Talento Humano y entraste por el portal de la empresa. Revisaste tu rol y notaste que faltaban dos horas extra: las reclamaste a tiempo.',
  },

  // Responder es, en este correo, exactamente "responder con mi usuario y mi
  // contraseña": el original nunca tuvo una acción de "responder genérico"
  // separada, así que el botón de la barra apunta directo a este final.
  e_credenciales: {
    kind: 'bad',
    verdict: 'Correo legítimo, reacción peligrosa',
    outcome:
      'El remitente era real, pero tu contraseña quedó escrita en un correo. Cualquiera que lea ese buzón (o que lo intercepte) la tiene, y el propio mensaje avisaba que Talento Humano nunca la pide.',
    score: 0,
  },
  e_borra: {
    kind: 'partial',
    verdict: 'Prudente, pero de más',
    outcome:
      'El correo era auténtico y lo descartaste sin mirarlo. No pasó nada malo, pero te quedaste sin revisar tu rol y el plazo para reclamar diferencias venció.',
    score: 50,
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'Lo reenviaste sin verificar',
    outcome:
      'El aviso era real, así que no pasó nada grave. Pero lo mandaste a otra persona antes de comprobarlo tú mismo: si hubiera sido falso, el reenvío habría llevado el engaño con tu nombre encima.',
    score: 50,
  },
  e_archivar: {
    kind: 'partial',
    verdict: 'Era real, y lo archivaste sin más',
    outcome:
      'No perdiste nada grave: el rol de pagos sigue disponible en el portal. Pero lo guardaste sin revisar si tus horas extra estaban completas, que era justo lo que había que comprobar.',
    score: 50,
  },
  e_spam: {
    kind: 'bad',
    verdict: 'Descartaste un aviso real',
    outcome:
      'Talento Humano sí publicó tu rol de pagos. Marcarlo como spam no solo te lo saca de la vista: le enseña al filtro a esconder los próximos avisos del mismo remitente, y esos sí los vas a necesitar.',
    score: 0,
  },
}

const ACCIONES: AccionCorreo[] = [
  { Icono: Reply, etiqueta: 'Responder', titulo: 'Responder', goto: 'e_credenciales', label: 'Respondió el correo con su usuario y su contraseña' },
  { Icono: Forward, etiqueta: 'Reenviar', titulo: 'Reenviar', goto: 'e_reenviar', label: 'Reenvió el correo a otra persona' },
  { Icono: Archive, etiqueta: 'Archivar', titulo: 'Archivar', goto: 'e_archivar', label: 'Archivó el correo' },
  { Icono: Trash2, etiqueta: 'Eliminar', titulo: 'Eliminar', goto: 'e_borra', label: 'Eliminó el correo' },
  { Icono: ShieldAlert, etiqueta: 'Spam', titulo: 'Marcar como spam', goto: 'e_spam', label: 'Marcó el correo como spam' },
]

const ASUNTO = 'Tu rol de pagos de julio ya está disponible'
const REMITENTE_NOMBRE = 'Talento Humano · Corporación Andes'
const DIRECCION = 'nomina@andes.com.ec'

const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_archivar: { vaciaRecibidos: true },
  e_borra: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_credenciales: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

function ResumenMensaje({ prefijo }: { prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {REMITENTE_NOMBRE.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{REMITENTE_NOMBRE}</p>
        <p className={styles.senderAddr}>{DIRECCION}</p>
        <p className={styles.mailFolderAsunto}>{prefijo ? `${prefijo} ${ASUNTO}` : ASUNTO}</p>
      </div>
    </div>
  )
}

function carpetasCorreo(current: string, isEnding: boolean): CarpetaCorreo[] {
  const destino = isEnding ? DESTINO_ACCION[current] : undefined
  const carpetas: CarpetaCorreo[] = [
    {
      nombre: 'Enviados',
      vacia: 'No hay correos enviados.',
      contenido:
        destino?.carpeta === 'Enviados' ? <ResumenMensaje prefijo={destino.prefijo} /> : undefined,
    },
    {
      nombre: 'Spam',
      vacia: 'No hay correos marcados como spam.',
      contenido: destino?.carpeta === 'Spam' ? <ResumenMensaje /> : undefined,
    },
    {
      nombre: 'Papelera',
      vacia: 'La papelera está vacía.',
      contenido: destino?.carpeta === 'Papelera' ? <ResumenMensaje /> : undefined,
    },
  ]

  if (destino?.vaciaRecibidos) {
    carpetas.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }

  return carpetas
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'remitente', pantalla: 'n1', texto: 'El dominio del remitente es <b>exactamente</b> el de la empresa: andes.com.ec.' },
  { id: 's2', targetId: 'saludo', pantalla: 'n1', texto: 'Te llama <b>por tu nombre</b> y menciona un período y un plazo concretos.' },
  { id: 's3', texto: '<b>No pide credenciales</b> ni datos: solo avisa dónde está la información.' },
  { id: 's4', targetId: 'canal', pantalla: 'n1', texto: 'Ofrece un <b>canal alterno verificable</b> (la extensión 214).' },
  { id: 's5', targetId: 'portal', pantalla: 'n1', texto: 'El portal está en el <b>dominio corporativo</b> y con conexión segura.' },
]

const RULE =
  'Regla de oro: no todo correo es una trampa. Lo que distingue a uno legítimo es que <b>no te pide tu clave y su dominio es el real</b>. Aun así, entra al portal escribiendo tú la dirección: es la costumbre que te protege siempre.'

const RESUMEN = 'Talento Humano avisa que tu rol de pagos de julio ya está en el portal.'

const CONTEXTO = (
  <>
    <p>
      Trabajas en <strong>Corporación Andes</strong>. Todos los meses Talento Humano publica el rol
      de pagos en el portal del colaborador y avisa por correo.
    </p>
    <p>
      Este mes trabajaste horas extra y quieres confirmar que estén incluidas antes de que cierre
      el plazo de reclamos.
    </p>
  </>
)

const NOTA = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      Lo primero que hagas cierra el escenario y te muestra en qué habría terminado.
    </p>
  </>
)

const MINUTOS_DE_ANTIGUEDAD = 24 * 60 + 40 // "ayer 17:20": ver horaDeLlegada.

function horaDeLlegada(): string {
  const ahora = new Date()
  const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 17, 20)
  return `ayer ${formatoHora(ayer)}`
}

const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Portal del colaborador',
    url: 'https://portal.andes.com.ec/rrhh/rol',
    segura: true,
    cierra: 'e_borra',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  { Icono: Building2, texto: 'Portal Andes', goto: 'n2', label: 'Abrió el portal del colaborador desde sus marcadores' },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{ nombre: REMITENTE_NOMBRE, direccion: DIRECCION, senalDireccion: 'remitente' }}
      recibido={recibido}
      pie={
        <>
          <p>Talento Humano · Corporación Andes</p>
          <p>Nunca te pediremos tu contraseña por correo ni por teléfono.</p>
        </>
      }
    >
      <p data-signal="saludo">Hola,</p>
      <p>
        Tu rol de pagos del período <b>julio 2026</b> ya está publicado en el portal del
        colaborador, junto con el detalle de horas extra y descuentos.
      </p>
      <p>
        Puedes consultarlo en <b data-signal="portal">portal.andes.com.ec</b>, con el mismo usuario
        de tu correo institucional. Si algo no cuadra, responde a este correo o escribe a{' '}
        <span data-signal="canal">la extensión 214</span> antes del 8 de agosto.
      </p>
    </CuerpoCorreo>
  )
}

function ContenidoPortal() {
  return (
    <div className={styles.page}>
      <p className={styles.brand}>Corporación Andes</p>
      <h2 className={styles.pageTitle}>Portal del colaborador</h2>
      <p className={styles.pageSub}>Ingresa con tu usuario institucional para ver tu rol de pagos.</p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Usuario</span>
          <span className={styles.input}>
            <span className="sr-only">Tu usuario, ya completado: </span>
            daniela.mora
          </span>
        </label>
        <label className={styles.field}>
          <span>Contraseña</span>
          <span className={styles.input}>
            <span className="sr-only">Tu contraseña, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot goto="e_bien" label="Ingresó a su portal del colaborador" className={styles.submit}>
          Ingresar
        </BotonHotspot>
      </div>

      <p className={styles.pageFooter}>portal.andes.com.ec · Talento Humano</p>
    </div>
  )
}

function DecisionEnCurso({ fallo, enFormulario }: { fallo: boolean; enFormulario: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <p className="text-lg leading-relaxed text-body">
        Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
        <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
      </p>

      {enFormulario && (
        <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
          El formulario ya aparece con <strong className="text-ink">tu usuario y tu clave escritos</strong>.
          Es así para no pedirte datos reales, pero enviarlo cuenta como iniciar sesión.
        </p>
      )}

      <p className="text-base leading-relaxed text-body">
        Lo primero que hagas cierra el escenario y te muestra en qué terminaba. No hay confirmación,
        igual que en la vida real. Puedes volver atrás con la flecha del navegador sin decidir nada.
      </p>

      {fallo && (
        <p role="status" className="rounded-md bg-surface-strong px-3 py-2 text-base text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </p>
      )}

      <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
        <summary className="cursor-pointer list-none text-base font-medium text-link underline decoration-dotted underline-offset-4">
          No sé por dónde empezar
        </summary>
        <p className="mt-2 text-base leading-relaxed text-body">
          Tienes varios caminos posibles: entrar al portal por tu cuenta desde los marcadores del
          navegador, responder el correo, o usar alguno de los botones de la barra de arriba. Cuál
          de ellos es el acertado es justamente lo que decides tú.
        </p>
      </details>
    </div>
  )
}

function RolDePagos() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/rol-de-pagos')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [recibido, setRecibido] = useState(horaDeLlegada)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      setPantallaActual(goto)
      setPestanas((abiertas) => (abiertas.includes(goto) ? abiertas : [...abiertas, goto]))
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setPestanas((abiertas) => abiertas.filter((id) => id !== cerrada))
    }

    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  const pantalla = (
    <Navegador
      pestanas={PESTANAS}
      abiertas={pestanas}
      activa={pantallaActual}
      marcadores={MARCADORES}
      onHotspot={onHotspot}
    >
      {pantallaActual === 'n1' ? (
        <ContenidoCorreo
          recibido={recibido}
          carpetas={carpetasCorreo(engine.current, engine.isEnding && !repasando)}
        />
      ) : (
        <ContenidoPortal />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/rol-de-pagos"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} enFormulario={pantallaActual === 'n2'} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/rol-de-pagos"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default RolDePagos
```

- [ ] **Step 2: Escribir `RolDePagos.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RolDePagos from './RolDePagos'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      cohort: null,
      onboardingVisto: true,
    },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    marcarOnboardingVisto: vi.fn(),
    onboardingDismissed: true,
    displayName: 'María',
    roleLabel: 'Participante',
    initials: 'MP',
    correoSimulado: 'mariaperez@safeweb.com',
  }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderEscenario() {
  render(
    <MemoryRouter>
      <RolDePagos />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('RolDePagos', () => {
  it('al eliminar el correo, la barra lateral lo refleja: sale de Recibidos y aparece en Papelera', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByText('No hay correos en la bandeja de entrada.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText('Tu rol de pagos de julio ya está disponible')).toBeDefined()
  })

  it('responder deja el veredicto de haber entregado la contraseña', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    expect(screen.getByText('Correo legítimo, reacción peligrosa')).toBeDefined()
  })

  it('entrar al portal desde los marcadores y pulsar Ingresar acredita el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Portal Andes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Acertaste · el correo era legítimo')).toBeDefined()
  })
})
```

- [ ] **Step 3: Correr los tests**

Run: `cd frontend && npx vitest run src/secciones/phishing/RolDePagos.test.tsx`
Expected: 3 tests en PASS.

- [ ] **Step 4: Verificación manual**

Levantar el dev server (`npm run dev` en `frontend/`) y jugar los 6 finales de Rol de pagos: Responder, Reenviar, Archivar, Eliminar, Spam, y el portal (Ingresar tras entrar por el marcador, y cerrar la pestaña sin ingresar). Confirmar que el repaso de señales resalta cada elemento (remitente, saludo, canal, portal) en la pantalla correcta.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/secciones/phishing/RolDePagos.tsx frontend/src/secciones/phishing/RolDePagos.test.tsx
git commit -m "feat(phishing): convert Rol de pagos to the interactive mechanic"
```

---

## Task 3: Convertir Código para actualizar datos (Quishing)

**Files:**
- Modify: `frontend/src/secciones/phishing/QuishingActualice.tsx` (reescritura completa)
- Test: `frontend/src/secciones/phishing/QuishingActualice.test.tsx` (nuevo)

**Interfaces:**
- Consumes: igual que Task 2.
- Produces: export default `QuishingActualice`.

- [ ] **Step 1: Reescribir `QuishingActualice.tsx` completo**

```tsx
import { Archive, Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

// QR decorativo y fijo: no es escaneable de verdad, solo tiene que leerse
// como un código QR dentro del cuerpo del correo. Tocarlo es "escanearlo".
const QR_SVG = `
  <svg width="120" height="120" viewBox="0 0 29 29" style="background:#fff;border:1px solid #ddd;padding:6px;">
    <rect width="29" height="29" fill="#fff"/>
    <g fill="#111">
      <rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/>
      <rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/>
      <rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/>
      <rect x="9" y="1" width="2" height="2"/><rect x="13" y="1" width="2" height="2"/><rect x="17" y="3" width="2" height="2"/>
      <rect x="9" y="9" width="3" height="3"/><rect x="14" y="9" width="2" height="4"/><rect x="18" y="10" width="4" height="2"/>
      <rect x="9" y="14" width="4" height="2"/><rect x="16" y="14" width="2" height="6"/><rect x="20" y="15" width="3" height="3"/>
      <rect x="9" y="18" width="2" height="4"/><rect x="13" y="19" width="3" height="2"/><rect x="9" y="24" width="6" height="2"/>
      <rect x="18" y="20" width="4" height="4"/><rect x="24" y="9" width="2" height="6"/><rect x="24" y="18" width="4" height="2"/>
      <rect x="24" y="22" width="2" height="5"/>
    </g>
  </svg>
`

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },

  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu cédula y tu clave en litoral-actualiza.web.app, un sitio que no es del banco. Con esos datos entraron a tu cuenta esa misma noche.',
  },
  // Absorbe el antiguo final "vista previa antes de escanear": un QR no tiene
  // href, así que no existe una vista previa real — escanear ya abre la
  // página falsa, y lo que distingue el buen final es cerrarla sin enviar el
  // formulario (ver spec §4.1).
  e_cierra: {
    kind: 'good',
    verdict: 'No caíste · cerraste sin completar nada',
    outcome:
      'Escaneaste el código y llegaste a litoral-actualiza.web.app, un sitio que no es del banco. El formulario pedía la clave de acceso —algo que una actualización de datos real nunca necesita— y cerraste la pestaña sin escribir nada. Un QR no se puede inspeccionar antes de escanearlo: la señal de alerta estaba en la página, no en el código.',
  },
  e_app: {
    kind: 'good',
    verdict: 'No caíste · entraste por tu cuenta',
    outcome: 'Entraste a la app del banco por tu cuenta. No había ninguna actualización de datos pendiente: el correo era falso.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome: 'Lo borraste sin escanear el código, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_spam: {
    kind: 'good',
    verdict: 'No caíste · lo reportaste',
    outcome: 'Marcarlo como spam es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente.',
  },
  e_archivar: {
    kind: 'partial',
    verdict: 'No caíste, pero lo dejaste ahí',
    outcome: 'Archivarlo te sacó el correo de la vista sin resolver nada. Sigue en tu buzón, y si mañana le llega a un compañero va a llegar igual de intacto.',
  },
  e_responder: {
    kind: 'partial',
    verdict: 'No entregaste nada, pero contestaste',
    outcome: 'No escaneaste el código, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero lo pasaste',
    outcome: 'Se lo reenviaste a otra persona para que opine. Tú no caíste, pero pusiste el código QR en la bandeja de alguien que quizá lo escanee sin la misma desconfianza.',
  },
}

const ACCIONES: AccionCorreo[] = [
  { Icono: Reply, etiqueta: 'Responder', titulo: 'Responder', goto: 'e_responder', label: 'Respondió el correo' },
  { Icono: Forward, etiqueta: 'Reenviar', titulo: 'Reenviar', goto: 'e_reenviar', label: 'Reenvió el correo a otra persona' },
  { Icono: Archive, etiqueta: 'Archivar', titulo: 'Archivar', goto: 'e_archivar', label: 'Archivó el correo' },
  { Icono: Trash2, etiqueta: 'Eliminar', titulo: 'Eliminar', goto: 'e_eliminar', label: 'Eliminó el correo' },
  { Icono: ShieldAlert, etiqueta: 'Spam', titulo: 'Marcar como spam', goto: 'e_spam', label: 'Marcó el correo como spam' },
]

const ASUNTO = 'Actualice sus datos antes de que se limite su cuenta'
const REMITENTE_NOMBRE = 'Banco del Litoral · Actualización de datos'
const DIRECCION = 'notificaciones@bancodellitoral.com'

const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_archivar: { vaciaRecibidos: true },
  e_eliminar: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_responder: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

function ResumenMensaje({ prefijo }: { prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {REMITENTE_NOMBRE.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{REMITENTE_NOMBRE}</p>
        <p className={styles.senderAddr}>{DIRECCION}</p>
        <p className={styles.mailFolderAsunto}>{prefijo ? `${prefijo} ${ASUNTO}` : ASUNTO}</p>
      </div>
    </div>
  )
}

function carpetasCorreo(current: string, isEnding: boolean): CarpetaCorreo[] {
  const destino = isEnding ? DESTINO_ACCION[current] : undefined
  const carpetas: CarpetaCorreo[] = [
    { nombre: 'Enviados', vacia: 'No hay correos enviados.', contenido: destino?.carpeta === 'Enviados' ? <ResumenMensaje prefijo={destino.prefijo} /> : undefined },
    { nombre: 'Spam', vacia: 'No hay correos marcados como spam.', contenido: destino?.carpeta === 'Spam' ? <ResumenMensaje /> : undefined },
    { nombre: 'Papelera', vacia: 'La papelera está vacía.', contenido: destino?.carpeta === 'Papelera' ? <ResumenMensaje /> : undefined },
  ]
  if (destino?.vaciaRecibidos) {
    carpetas.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }
  return carpetas
}

const SENALES: Senal[] = [
  { id: 's1', targetId: 'qr', pantalla: 'n1', texto: 'Un <b>QR es un enlace que no puedes leer antes de escanearlo</b>: no hay texto que inspeccionar antes de tocarlo.' },
  { id: 's2', targetId: 'remitente', pantalla: 'n1', texto: 'El destino real es <b>litoral-actualiza.web.app</b>, sin el dominio del banco.' },
  { id: 's3', targetId: 'campo-clave', pantalla: 'n2', texto: 'El formulario pide la <b>clave de acceso</b>, algo que una actualización de datos nunca necesita.' },
  { id: 's4', targetId: 'plazo', pantalla: 'n1', texto: 'Mete <b>prisa</b> con un plazo de 72 horas.' },
]

const RULE =
  'Regla de oro: al escanear un QR, primero <b>lee la vista previa de la URL</b> y recién ahí decide. Vale igual para los QR de correos, locales, surtidores y parquímetros.'

const RESUMEN = 'Un correo del banco pide escanear un QR para "actualizar tus datos".'

const CONTEXTO = (
  <>
    <p>
      Sos cliente del <strong>Banco del Litoral</strong>. Este mes el banco sí pidió, dentro de su
      app, que los clientes actualicen algunos datos.
    </p>
    <p>
      Ahora te llega un correo aparte, con un código QR grande y ningún enlace de texto que puedas
      revisar antes de escanear.
    </p>
  </>
)

const NOTA = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      Lo primero que hagas cierra el escenario y te muestra en qué habría terminado.
    </p>
  </>
)

const MINUTOS_DE_ANTIGUEDAD = 40

function horaDeLlegada(): string {
  const llegada = new Date(Date.now() - MINUTOS_DE_ANTIGUEDAD * 60_000)
  return `hoy ${formatoHora(llegada)}`
}

const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Actualización de datos',
    url: 'http://litoral-actualiza.web.app/actualizar',
    segura: false,
    cierra: 'e_cierra',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral', goto: 'e_app', label: 'Entró directamente a la app del banco desde sus marcadores' },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{
        nombre: REMITENTE_NOMBRE,
        direccion: DIRECCION,
        etiqueta: 'Externo',
        senalDireccion: 'remitente',
        senalEtiqueta: 'externo',
      }}
      recibido={recibido}
      pie={<p className="fine">Banco del Litoral · Este es un mensaje automático.</p>}
    >
      <p>Estimado cliente:</p>
      <p>
        Según nuestra política de actualización de datos, necesitamos que confirme su información
        antes de{' '}
        <mark className={styles.marca} data-signal="plazo">
          72 horas
        </mark>
        . Escanee el siguiente código con la cámara de su celular para continuar:
      </p>
      <div style={{ textAlign: 'center', margin: '14px 0' }}>
        {/* El nombre accesible de un botón sale de su texto visible, y el SVG
            no tiene ninguno: sin este span el botón quedaría sin nombre para
            un lector de pantalla (y sin forma de ubicarlo por rol+nombre en
            los tests). */}
        <BotonHotspot goto="n2" label="Escaneó el código QR" signalId="qr">
          <span className="sr-only">Código QR — escanear para continuar</span>
          <span dangerouslySetInnerHTML={{ __html: QR_SVG }} />
        </BotonHotspot>
      </div>
    </CuerpoCorreo>
  )
}

function ContenidoPortalFalso() {
  return (
    <div className={styles.page}>
      <p className={styles.brand}>Banco del Litoral</p>
      <h2 className={styles.pageTitle}>Actualización de datos</h2>
      <p className={styles.pageSub}>Confirme su información para evitar la limitación de su cuenta.</p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Cédula</span>
          <span className={styles.input}>
            <span className="sr-only">Tu cédula, ya completada: </span>
            0000000000
          </span>
        </label>
        <label className={styles.field} data-signal="campo-clave">
          <span>Clave de acceso</span>
          <span className={styles.input}>
            <span className="sr-only">Tu clave, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot goto="e_datos" label="Ingresó su cédula y su clave de acceso" className={styles.submit}>
          Confirmar datos
        </BotonHotspot>
      </div>
    </div>
  )
}

function DecisionEnCurso({ fallo, enPagina }: { fallo: boolean; enPagina: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <p className="text-lg leading-relaxed text-body">
        Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
        <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
      </p>

      {enPagina && (
        <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
          El formulario ya aparece con{' '}
          <strong className="text-ink">tu cédula y tu clave de acceso escritas</strong>. Es así
          para no pedirte datos reales, pero enviarlo cuenta como entregarlos.
        </p>
      )}

      <p className="text-base leading-relaxed text-body">
        Lo primero que hagas cierra el escenario y te muestra en qué terminaba. No hay confirmación,
        igual que en la vida real. Puedes volver atrás con la flecha del navegador sin decidir nada.
      </p>

      {fallo && (
        <p role="status" className="rounded-md bg-surface-strong px-3 py-2 text-base text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </p>
      )}

      <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
        <summary className="cursor-pointer list-none text-base font-medium text-link underline decoration-dotted underline-offset-4">
          No sé por dónde empezar
        </summary>
        <p className="mt-2 text-base leading-relaxed text-body">
          Tienes tres caminos posibles: escanear el código y ver a dónde lleva, dejarlo de lado y
          entrar a la app del banco por tu cuenta desde los marcadores, o usar alguno de los
          botones de la barra de arriba. Cuál de ellos es el acertado es justamente lo que decides
          tú.
        </p>
      </details>
    </div>
  )
}

function QuishingActualice() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/quishing-actualice')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [recibido, setRecibido] = useState(horaDeLlegada)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      setPantallaActual(goto)
      setPestanas((abiertas) => (abiertas.includes(goto) ? abiertas : [...abiertas, goto]))
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setPestanas((abiertas) => abiertas.filter((id) => id !== cerrada))
    }

    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  const pantalla = (
    <Navegador pestanas={PESTANAS} abiertas={pestanas} activa={pantallaActual} marcadores={MARCADORES} onHotspot={onHotspot}>
      {pantallaActual === 'n1' ? (
        <ContenidoCorreo recibido={recibido} carpetas={carpetasCorreo(engine.current, engine.isEnding && !repasando)} />
      ) : (
        <ContenidoPortalFalso />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/quishing-actualice"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} enPagina={pantallaActual === 'n2'} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/quishing-actualice"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default QuishingActualice
```

- [ ] **Step 2: Escribir `QuishingActualice.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import QuishingActualice from './QuishingActualice'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      cohort: null,
      onboardingVisto: true,
    },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    marcarOnboardingVisto: vi.fn(),
    onboardingDismissed: true,
    displayName: 'María',
    roleLabel: 'Participante',
    initials: 'MP',
    correoSimulado: 'mariaperez@safeweb.com',
  }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderEscenario() {
  render(
    <MemoryRouter>
      <QuishingActualice />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('QuishingActualice', () => {
  it('escanear el QR y enviar el formulario cuenta como caer en la trampa', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Código QR — escanear para continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar datos' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('entrar por la app del banco desde los marcadores acredita sin escanear', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Banco del Litoral' }))

    expect(screen.getByText('No caíste · entraste por tu cuenta')).toBeDefined()
  })

  it('al marcar como spam, la barra lateral lo refleja', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como spam' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Spam' }))

    expect(screen.getByRole('heading', { name: 'Spam' })).toBeDefined()
    expect(screen.getByText('Actualice sus datos antes de que se limite su cuenta')).toBeDefined()
  })
})
```

- [ ] **Step 3: Correr los tests**

Run: `cd frontend && npx vitest run src/secciones/phishing/QuishingActualice.test.tsx`
Expected: 3 tests en PASS.

- [ ] **Step 4: Verificación manual**

Confirmar en el navegador los 7 finales (escanear+enviar, escanear+cerrar, app desde marcadores, y los 4 de la barra), y que el repaso resalta el QR mismo (no un elemento de texto) para la señal `s1`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/secciones/phishing/QuishingActualice.tsx frontend/src/secciones/phishing/QuishingActualice.test.tsx
git commit -m "feat(phishing): convert Quishing (código QR) to the interactive mechanic"
```

---

## Task 4: Convertir Inicio de sesión desconocido (Sesión Bogotá)

El más complejo de los tres: dos páginas falsas encadenadas (clave → OTP) que
deben verse como el *mismo sitio* avanzando un paso, no como dos pestañas
nuevas.

**Files:**
- Modify: `frontend/src/secciones/phishing/SesionBogota.tsx` (reescritura completa)
- Test: `frontend/src/secciones/phishing/SesionBogota.test.tsx` (nuevo)

**Interfaces:**
- Consumes: igual que Task 2/3.
- Produces: export default `SesionBogota`.

**Nota de contenido (bugfix, no cambia el diseño aprobado):** las señales `s2`
y `s3` del archivo actual apuntan a pantallas equivocadas — `s2` describe el
truco del dominio pero resalta la dirección del *remitente* en `n1` (que es
un dominio limpio, `bancodellitoral.com.ec`, tal como dice la propia señal
`s4` sobre lo impecable del correo) en vez de la URL falsa de la página; `s3`
describe el código OTP pero su `senal: 'campo-clave'` está puesto en el campo
de **contraseña** de `n2`, no en el campo de OTP de `n3` (que hoy no lleva
ningún `senal`). Al reescribir el anclaje preciso que exige la mecánica
interactiva, este plan corrige ambas: `s2` pasa a anclarse a la URL de `n2`
(la pestaña falsa), y `s3` al campo de `n3` (el paso de OTP). El texto de
ambas señales no cambia, solo su ancla.

- [ ] **Step 1: Reescribir `SesionBogota.tsx` completo**

```tsx
import { Archive, Forward, Landmark, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, EnlaceHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import { Navegador, type MarcadorNavegador, type PestanaConfig } from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  n3: { kind: 'scene' },

  e_otp: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome: 'Mientras escribías el código, el atacante lo usaba en vivo para entrar a tu cuenta real. Cuando terminaste, tu cuenta ya estaba vacía.',
  },
  e_detiene: {
    kind: 'good',
    verdict: 'No caíste · te detuviste a tiempo',
    outcome: 'Ya habías escrito la contraseña en el sitio falso, pero no llegaste a dar el código. Cambiaste la contraseña desde la app oficial antes de que la usaran.',
  },
  e_dominio: {
    kind: 'good',
    verdict: 'No caíste · leíste el dominio completo',
    outcome: 'El dominio real es "seguridad-alertas.com" — bancodellitoral.com.ec es solo un subdominio dentro de esa trampa. Cerraste la página sin escribir nada.',
  },
  e_app: {
    kind: 'good',
    verdict: 'No caíste · verificaste por la app',
    outcome: 'Entraste a la app del banco por tu cuenta. No había ningún acceso desde Bogotá: el correo era falso.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome: 'Lo borraste sin tocar el enlace de la alerta, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_spam: {
    kind: 'good',
    verdict: 'No caíste · lo reportaste',
    outcome: 'Marcarlo como spam es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente.',
  },
  e_archivar: {
    kind: 'partial',
    verdict: 'No caíste, pero lo dejaste ahí',
    outcome: 'Archivarlo te sacó la alerta de la vista sin resolver nada. Sigue en tu buzón, y si mañana le llega a un compañero va a llegar igual de intacta.',
  },
  e_responder: {
    kind: 'partial',
    verdict: 'No entregaste nada, pero contestaste',
    outcome: 'No tocaste el enlace, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero la pasaste',
    outcome: 'Se la reenviaste a otra persona para que opine. Tú no caíste, pero pusiste la alerta —con su enlace— en la bandeja de alguien que quizá no la mire con la misma desconfianza.',
  },
}

const ACCIONES: AccionCorreo[] = [
  { Icono: Reply, etiqueta: 'Responder', titulo: 'Responder', goto: 'e_responder', label: 'Respondió el correo' },
  { Icono: Forward, etiqueta: 'Reenviar', titulo: 'Reenviar', goto: 'e_reenviar', label: 'Reenvió el correo a otra persona' },
  { Icono: Archive, etiqueta: 'Archivar', titulo: 'Archivar', goto: 'e_archivar', label: 'Archivó el correo' },
  { Icono: Trash2, etiqueta: 'Eliminar', titulo: 'Eliminar', goto: 'e_eliminar', label: 'Eliminó el correo' },
  { Icono: ShieldAlert, etiqueta: 'Spam', titulo: 'Marcar como spam', goto: 'e_spam', label: 'Marcó el correo como spam' },
]

const ASUNTO = 'Alerta de seguridad: nuevo inicio de sesión'
const REMITENTE_NOMBRE = 'Banco del Litoral · Seguridad'
const DIRECCION = 'alertas@bancodellitoral.com.ec'

const DESTINO_ACCION: Record<
  string,
  { carpeta?: 'Enviados' | 'Spam' | 'Papelera'; prefijo?: string; vaciaRecibidos: boolean }
> = {
  e_archivar: { vaciaRecibidos: true },
  e_eliminar: { carpeta: 'Papelera', vaciaRecibidos: true },
  e_spam: { carpeta: 'Spam', vaciaRecibidos: true },
  e_responder: { carpeta: 'Enviados', prefijo: 'Re:', vaciaRecibidos: false },
  e_reenviar: { carpeta: 'Enviados', prefijo: 'Fwd:', vaciaRecibidos: false },
}

function ResumenMensaje({ prefijo }: { prefijo?: string }) {
  return (
    <div className={styles.senderRow}>
      <div className={styles.avatar} aria-hidden>
        {REMITENTE_NOMBRE.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.senderId}>
        <p className={styles.senderName}>{REMITENTE_NOMBRE}</p>
        <p className={styles.senderAddr}>{DIRECCION}</p>
        <p className={styles.mailFolderAsunto}>{prefijo ? `${prefijo} ${ASUNTO}` : ASUNTO}</p>
      </div>
    </div>
  )
}

function carpetasCorreo(current: string, isEnding: boolean): CarpetaCorreo[] {
  const destino = isEnding ? DESTINO_ACCION[current] : undefined
  const carpetas: CarpetaCorreo[] = [
    { nombre: 'Enviados', vacia: 'No hay correos enviados.', contenido: destino?.carpeta === 'Enviados' ? <ResumenMensaje prefijo={destino.prefijo} /> : undefined },
    { nombre: 'Spam', vacia: 'No hay correos marcados como spam.', contenido: destino?.carpeta === 'Spam' ? <ResumenMensaje /> : undefined },
    { nombre: 'Papelera', vacia: 'La papelera está vacía.', contenido: destino?.carpeta === 'Papelera' ? <ResumenMensaje /> : undefined },
  ]
  if (destino?.vaciaRecibidos) {
    carpetas.push({ nombre: 'Recibidos', vacia: 'No hay correos en la bandeja de entrada.' })
  }
  return carpetas
}

// s2 anclada a la URL de n2 (la página falsa), no al remitente: ver nota de
// contenido al inicio de la Tarea 4. s3 anclada al campo de n3 (el OTP).
const SENALES: Senal[] = [
  { id: 's1', targetId: 'cta-trampa', pantalla: 'n1', texto: 'El botón "seguro" ("No fui yo") es la trampa: te lleva directo a pedir credenciales.' },
  { id: 's2', targetId: 'url-falsa', pantalla: 'n2', texto: 'El dominio real es <b>seguridad-alertas.com</b>; "bancodellitoral.com.ec" es apenas un subdominio.' },
  { id: 's3', targetId: 'campo-otp', pantalla: 'n3', texto: 'Pide el <b>código OTP dentro de una página web</b>, en vez de dentro de la app del banco.' },
  { id: 's4', texto: 'El correo está impecable — sin errores — porque la trampa no está en la redacción.' },
]

const RULE =
  'Regla de oro: lee el dominio de derecha a izquierda; lo real es lo que está inmediatamente antes de la primera barra. Ninguna alerta se atiende desde el enlace de la propia alerta.'

const RESUMEN = 'Un correo avisa que alguien inició sesión en tu cuenta desde Bogotá.'

const CONTEXTO = (
  <>
    <p>
      Sos cliente del <strong>Banco del Litoral</strong>. Nunca viajaste a Colombia y no reconocés
      ningún acceso reciente desde ahí.
    </p>
    <p>Son casi las diez de la noche cuando te llega la alerta.</p>
  </>
)

const NOTA = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      Lo primero que hagas cierra el escenario y te muestra en qué habría terminado.
    </p>
  </>
)

const FALSO = 'bancodellitoral.com.ec.seguridad-alertas.com'

// n3 lleva `mismaPestana: true`: pasar de la página de clave al OTP es el
// mismo sitio avanzando un paso, no una pestaña nueva (spec §2.2 y §5).
const PESTANAS: Record<string, PestanaConfig & { mismaPestana?: boolean }> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Verificación de seguridad',
    url: `https://${FALSO}/clave`,
    segura: true,
    cierra: 'e_dominio',
    senalUrl: 'url-falsa',
  },
  n3: {
    titulo: 'Un paso más',
    url: `https://${FALSO}/otp`,
    segura: true,
    cierra: 'e_detiene',
    mismaPestana: true,
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral', goto: 'e_app', label: 'Verificó los accesos desde la app del banco' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{
        nombre: REMITENTE_NOMBRE,
        direccion: DIRECCION,
        etiqueta: 'Externo',
        senalDireccion: 'remitente',
        senalEtiqueta: 'externo',
      }}
      recibido={recibido}
      pie={<p>Banco del Litoral · Departamento de Seguridad</p>}
    >
      <p>Estimado cliente:</p>
      <p>
        Detectamos un inicio de sesión en su cuenta desde <b>Bogotá, Colombia</b>, un dispositivo
        que no reconocemos.
      </p>
      <p>Si fue usted, puede ignorar este mensaje. Si no, actúe de inmediato:</p>
      <p>
        <EnlaceHotspot
          goto="n2"
          label="Hizo clic en 'No fui yo — proteger mi cuenta'"
          href={`https://${FALSO}/clave`}
          signalId="cta-trampa"
          className="cta"
        >
          No fui yo — proteger mi cuenta
        </EnlaceHotspot>
      </p>
    </CuerpoCorreo>
  )
}

function ContenidoPaginaClave() {
  return (
    <div className={styles.page}>
      <p className={styles.brand}>Banco del Litoral</p>
      <h2 className={styles.pageTitle}>Verificación de seguridad</h2>
      <p className={styles.pageSub}>Confirme su contraseña para cerrar el acceso no reconocido.</p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Contraseña de banca en línea</span>
          <span className={styles.input}>
            <span className="sr-only">Tu contraseña, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot goto="n3" label="Escribió su contraseña para cerrar el acceso no reconocido" className={styles.submit}>
          Cerrar acceso no reconocido
        </BotonHotspot>
      </div>
    </div>
  )
}

function ContenidoPaginaOtp() {
  return (
    <div className={styles.page}>
      <p className={styles.brand}>Banco del Litoral</p>
      <h2 className={styles.pageTitle}>Un paso más</h2>
      <p className={styles.pageSub}>Ingrese el código que le acabamos de enviar por SMS.</p>

      <div className={styles.form}>
        <label className={styles.field} data-signal="campo-otp">
          <span>Código de verificación</span>
          <span className={styles.input}>
            <span className="sr-only">El código, ya completado: </span>
            000000
          </span>
        </label>
        <BotonHotspot goto="e_otp" label="Escribió el código que llegó por SMS" className={styles.submit}>
          Confirmar y cerrar sesión
        </BotonHotspot>
      </div>
    </div>
  )
}

function DecisionEnCurso({ fallo, pantalla }: { fallo: boolean; pantalla: string }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <p className="text-lg leading-relaxed text-body">
        Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
        <strong>cualquier parte de ella</strong>, incluida la barra de abajo. Antes de tocar un
        enlace, mantén el cursor encima para ver a dónde lleva.
      </p>

      {pantalla === 'n2' && (
        <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
          El campo ya aparece con <strong className="text-ink">tu contraseña escrita</strong>. Es
          así para no pedirte datos reales, pero enviarla cuenta como entregarla.
        </p>
      )}
      {pantalla === 'n3' && (
        <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
          El campo ya aparece con <strong className="text-ink">el código escrito</strong>. Es así
          para no pedirte datos reales, pero enviarlo cuenta como entregarlo.
        </p>
      )}

      <p className="text-base leading-relaxed text-body">
        Lo primero que hagas cierra el escenario y te muestra en qué terminaba. No hay confirmación,
        igual que en la vida real. Puedes volver atrás con la flecha del navegador sin decidir nada.
      </p>

      {fallo && (
        <p role="status" className="rounded-md bg-surface-strong px-3 py-2 text-base text-body">
          Ahí no hay nada que hacer. Solo algunos elementos responden: recórrelos con el cursor (o
          con la tecla Tab) y se marcarán al pasar.
        </p>
      )}

      <details className="group rounded-md border border-hairline-strong bg-surface px-3 py-2">
        <summary className="cursor-pointer list-none text-base font-medium text-link underline decoration-dotted underline-offset-4">
          No sé por dónde empezar
        </summary>
        <p className="mt-2 text-base leading-relaxed text-body">
          Tienes dos caminos posibles: hacer lo que la alerta pide, o dejarla de lado y entrar a
          verificar por la app del banco desde los marcadores. Cuál de los dos es el acertado es
          justamente lo que decides tú.
        </p>
      </details>
    </div>
  )
}

function SesionBogota() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/sesion-bogota')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      const destino = pantallaActual
      setPantallaActual(goto)
      setPestanas((abiertas) => {
        if (PESTANAS[goto]?.mismaPestana) {
          return abiertas.map((id) => (id === destino ? goto : id))
        }
        return abiertas.includes(goto) ? abiertas : [...abiertas, goto]
      })
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
  }

  const onHotspot = (event: React.MouseEvent) => {
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      setPestanas((abiertas) => abiertas.filter((id) => id !== cerrada))
    }

    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  const pantalla = (
    <Navegador pestanas={PESTANAS} abiertas={pestanas} activa={pantallaActual} marcadores={MARCADORES} onHotspot={onHotspot}>
      {pantallaActual === 'n1' ? (
        <ContenidoCorreo carpetas={carpetasCorreo(engine.current, engine.isEnding && !repasando)} recibido="hoy 21:47" />
      ) : pantallaActual === 'n2' ? (
        <ContenidoPaginaClave />
      ) : (
        <ContenidoPaginaOtp />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/sesion-bogota"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} pantalla={pantallaActual} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/sesion-bogota"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default SesionBogota
```

Nota sobre `recibido`: la hora original era un valor fijo ("hoy 21:47") ligado
a la historia ("son casi las diez de la noche"), no relativa al momento de
juego como en Factura SRI/Rol de pagos/Quishing — se mantiene fija a
propósito, igual que en el archivo actual.

- [ ] **Step 2: Escribir `SesionBogota.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import SesionBogota from './SesionBogota'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      cohort: null,
      onboardingVisto: true,
    },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    marcarOnboardingVisto: vi.fn(),
    onboardingDismissed: true,
    displayName: 'María',
    roleLabel: 'Participante',
    initials: 'MP',
    correoSimulado: 'mariaperez@safeweb.com',
  }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderEscenario() {
  render(
    <MemoryRouter>
      <SesionBogota />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('SesionBogota', () => {
  it('completar clave y luego el código de un tirón cae en la trampa', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'No fui yo — proteger mi cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar acceso no reconocido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y cerrar sesión' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('pasar de la página de clave al OTP no abre una pestaña nueva: sigue habiendo solo dos', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'No fui yo — proteger mi cuenta' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar acceso no reconocido' }))

    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Un paso más' })).toBeDefined()
  })

  it('verificar por la app del banco desde los marcadores acredita sin escribir nada', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Banco del Litoral' }))

    expect(screen.getByText('No caíste · verificaste por la app')).toBeDefined()
  })
})
```

- [ ] **Step 3: Correr los tests**

Run: `cd frontend && npx vitest run src/secciones/phishing/SesionBogota.test.tsx`
Expected: 3 tests en PASS. El segundo test es el que confirma la transición
"misma pestaña" (Task 4 es la única de las tres que la ejercita).

- [ ] **Step 4: Verificación manual**

Confirmar en el navegador los 8 finales, y en particular: que al enviar la
contraseña en la página de clave la pestaña cambia de título a "Un paso más"
sin que aparezca una pestaña nueva en la tira; y que el repaso de señales,
al mostrar `s2` (URL falsa) después de haber llegado a `e_otp` o `e_detiene`,
vuelve correctamente a la pantalla de la página de clave.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/secciones/phishing/SesionBogota.tsx frontend/src/secciones/phishing/SesionBogota.test.tsx
git commit -m "feat(phishing): convert Sesión Bogotá to the interactive mechanic"
```

---

## Task 5: Registrar el cambio de versión en el catálogo

**Files:**
- Modify: `frontend/src/data/catalogo.ts:131-195`

**Interfaces:**
- Consumes: nada nuevo — solo edita los tres objetos `Escenario` ya existentes.
- Produces: nada que otras tareas consuman.

- [ ] **Step 1: Actualizar las tres entradas**

En `frontend/src/data/catalogo.ts`, la entrada de `rol-de-pagos` (alrededor
de la línea 131) pasa de:

```ts
  {
    seccionId: 'phishing',
    escenarioId: 'rol-de-pagos',
    titulo: 'Rol de pagos disponible',
    descripcion: 'Talento Humano notifica que el rol del mes ya está publicado en el portal.',
    version: 2,
    naturaleza: 'legitimo',
    dificultad: 3,
    espeja: 'phishing/clave-caducada',
    Component: lazy(() => import('../secciones/phishing/RolDePagos')),
  },
```

a:

```ts
  {
    seccionId: 'phishing',
    escenarioId: 'rol-de-pagos',
    titulo: 'Rol de pagos disponible',
    descripcion: 'Talento Humano notifica que el rol del mes ya está publicado en el portal.',
    // v3: el escenario se juega en un navegador con pestañas — el
    // participante actúa directo sobre el correo y el portal en vez de
    // elegir de una lista de opciones. Las corridas de versiones distintas
    // no son comparables entre sí.
    version: 3,
    naturaleza: 'legitimo',
    dificultad: 3,
    espeja: 'phishing/clave-caducada',
    Component: lazy(() => import('../secciones/phishing/RolDePagos')),
  },
```

La de `quishing-actualice` (alrededor de la línea 161) pasa de:

```ts
  {
    seccionId: 'phishing',
    escenarioId: 'quishing-actualice',
    titulo: 'Código para actualizar datos',
    descripcion: 'El banco pide escanear un código QR para no perder el acceso a la cuenta.',
    version: 2,
    naturaleza: 'fraude',
    dificultad: 4,
    espeja: 'phishing/aviso-filtracion',
    Component: lazy(() => import('../secciones/phishing/QuishingActualice')),
  },
```

a:

```ts
  {
    seccionId: 'phishing',
    escenarioId: 'quishing-actualice',
    titulo: 'Código para actualizar datos',
    descripcion: 'El banco pide escanear un código QR para no perder el acceso a la cuenta.',
    // v3: el escenario se juega en un navegador con pestañas; el QR es el
    // punto interactivo (no hay "vista previa" posible, así que escanear ya
    // abre la página falsa). Las corridas de versiones distintas no son
    // comparables entre sí.
    version: 3,
    naturaleza: 'fraude',
    dificultad: 4,
    espeja: 'phishing/aviso-filtracion',
    Component: lazy(() => import('../secciones/phishing/QuishingActualice')),
  },
```

Y la de `sesion-bogota` (alrededor de la línea 186) pasa de:

```ts
  {
    // El más difícil del módulo: la redacción es impecable y el anzuelo está en
    // el dominio y en pedir el OTP fuera de la app. Espeja con aviso-filtracion,
    // que es la misma forma —una alerta de seguridad— pero verdadera.
    seccionId: 'phishing',
    escenarioId: 'sesion-bogota',
    titulo: 'Inicio de sesión desconocido',
    descripcion: 'Una alerta nocturna avisa de un acceso a tu cuenta desde otra ciudad.',
    version: 2,
    naturaleza: 'fraude',
    dificultad: 5,
    espeja: 'phishing/aviso-filtracion',
    Component: lazy(() => import('../secciones/phishing/SesionBogota')),
  },
```

a:

```ts
  {
    // El más difícil del módulo: la redacción es impecable y el anzuelo está en
    // el dominio y en pedir el OTP fuera de la app. Espeja con aviso-filtracion,
    // que es la misma forma —una alerta de seguridad— pero verdadera.
    //
    // v3: el escenario se juega en un navegador con pestañas; pasar de la
    // página de clave al OTP es la misma pestaña avanzando un paso, como en
    // un kit de phishing real. Las corridas de versiones distintas no son
    // comparables entre sí.
    seccionId: 'phishing',
    escenarioId: 'sesion-bogota',
    titulo: 'Inicio de sesión desconocido',
    descripcion: 'Una alerta nocturna avisa de un acceso a tu cuenta desde otra ciudad.',
    version: 3,
    naturaleza: 'fraude',
    dificultad: 5,
    espeja: 'phishing/aviso-filtracion',
    Component: lazy(() => import('../secciones/phishing/SesionBogota')),
  },
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/catalogo.ts
git commit -m "chore(catalogo): bump version for the three converted scenarios"
```

---

## Task 6: Verificación final

**Files:** ninguno (solo comandos).

- [ ] **Step 1: Suite completa de frontend**

Run: `cd frontend && npx vitest run`
Expected: todos los tests en PASS, incluidos los nuevos de Tasks 2-4 y los
existentes de `FacturaSri`, `App`, `Seccion`, `useScenarioRun`, `pendingRuns`.

- [ ] **Step 2: Lint y typecheck completos**

Run: `cd frontend && npx tsc --noEmit && npx eslint src`
Expected: sin errores.

- [ ] **Step 3: Build de producción**

Run: `cd frontend && npm run build`
Expected: build exitoso, sin warnings de módulos rotos.

- [ ] **Step 4: Recorrido manual final**

Con el dev server levantado, jugar de punta a punta los cuatro escenarios de
phishing que hoy usan esta mecánica (Factura SRI, Rol de pagos, Quishing,
Sesión Bogotá) y confirmar que `ClaveCaducada` (que sigue en `StoryEscenario`)
se ve y se juega exactamente igual que antes.
