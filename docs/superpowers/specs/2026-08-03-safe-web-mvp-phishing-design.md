# Diseño: MVP de phishing, microservicios y registro con cédula

**Fecha:** 2026-08-03
**Proyecto:** SAFE Web — Trabajo de Integración Curricular
**Estado:** diseño aprobado, pendiente plan de implementación
**Reemplaza parcialmente:** `docs/ARQUITECTURA.md` §2, §3, §5, §6, §7, §10, §11 y
`docs/DESIGN.md` §2, §10. Ambos documentos se actualizan como parte de la
implementación; hasta entonces, este spec manda sobre ellos.

---

## 1. Objetivo

Reducir el alcance a un MVP de una sola amenaza (**phishing**) que el
participante debe **aprobar** —6 de 8 escenarios— y sobre el que se construye
después la emisión de certificados. En el camino se cambian tres cosas
estructurales: el registro pasa a identificar personas de forma única mediante
cédula, el backend se parte en microservicios, y la marca pasa de negro/azul a
verde `#006837`.

### 1.1 Qué cambia respecto de hoy

| Área | Hoy | Después |
|---|---|---|
| Registro | nombre, correo, teléfono | nombre, apellido, correo, **cédula** |
| Amenazas activas | 6 secciones, 11 escenarios | **solo phishing**, 8 escenarios |
| Escenarios de phishing | 3 (2 fraude, 1 legítimo) | **8 (6 fraude, 2 legítimos)** |
| Progreso | informativo ("completado") | **gating: 6/8 aprobados** |
| Primer ingreso | directo al dashboard | **pantalla de bienvenida** |
| Backend | monolito NestJS | **2 microservicios** |
| Marca | negro `#000000` + azul `#0d74ce` | **verde `#006837`** |

### 1.2 Fuera de alcance de este spec

- **Certificado y su envío por correo.** Diferido explícitamente. Con él vuelven
  la verificación de correo por código, un servicio `notificaciones` y la
  dependencia de SMTP. Ver §11.
- Las otras cinco amenazas (smishing, vishing, suplantación, estafa, físico).
  Sus escenarios ya construidos se **comentan**, no se borran.
- Terminación TLS y respaldo del volumen de la base (ya pendientes desde antes).

---

## 2. Restricciones heredadas que no se relajan

Del `docs/ARQUITECTURA.md` §1, siguen gobernando:

1. **Es un instrumento de investigación.** Una corrida perdida es un dato
   perdido del estudio.
2. **Los datos personales no llegan al análisis.** Este spec la endurece: pasa
   de ser una regla de disciplina a una imposibilidad técnica (§4.3).
3. **La usan personas no técnicas.** Interfaz simple, escenarios simulados que
   nunca conectan con sistemas reales.

---

## 3. Fases

El trabajo se ejecuta en este orden. Cada fase deja el sistema funcionando.

| # | Fase | Depende de | Por qué en esa posición |
|---|---|---|---|
| **F0** | Repaint verde | — | Independiente y barato. Cambia 6 valores en `index.css` y 1 línea en `AuthLayout.tsx`; el resto pasa por tokens. |
| **F1** | Corte en 2 microservicios, **sin cambio funcional** | — | El corte estructural se hace con la superficie chica. Mezclarlo con cambios de comportamiento haría imposible saber qué rompió qué. |
| **F2** | Registro nuevo (nombre, apellido, cédula, correo) | F1 | Toca solo `identidad`, que ya existe como servicio. |
| **F3** | MVP solo phishing + gating 6/8 + bienvenida | F2 | La bienvenida necesita el campo `onboardingVistoAt` del registro nuevo. |
| **F4** | Los 5 escenarios de phishing faltantes | F3 | Volumen de contenido, riesgo cero, no bloquea nada. |

---

## 4. Arquitectura

### 4.1 Topología

```
                    Navegador
                        │  HTTPS (TLS delante de web, pendiente)
              ┌─────────▼──────────┐
              │  web · Nginx :8080 │   sirve la SPA y actúa de gateway
              └─────────┬──────────┘
              ┌─────────┴─────────┐
        /api/auth/*          /api/runs/*
              │                   │
       ┌──────▼──────┐    ┌───────▼────────┐
       │  identidad  │    │  entrenamiento │
       │    :3001    │    │     :3002      │
       │ PII · JWT   │    │ corridas·gating│
       └──────┬──────┘    └───────┬────────┘
              │                   │
       ┌──────▼───────────────────▼────────┐
       │  Postgres  (sin puerto al host)   │
       │   schema identidad                │
       │   schema entrenamiento            │
       └───────────────────────────────────┘
```

Decisiones estructurales:

| Decisión | Motivo |
|---|---|
| Nginx es el único servicio alcanzable desde afuera; enruta por prefijo de ruta | Se conserva el mismo origen para SPA y API (sin CORS en producción) y no se expone ningún servicio de aplicación. |
| `identidad` y `entrenamiento` **no se llaman entre sí** | El JWT lleva todo lo que ambos necesitan. Cero acoplamiento en tiempo de ejecución: si `identidad` cae, las corridas en curso se siguen registrando. |
| Un Postgres, un **schema por servicio**, sin llave foránea cruzada | Cada servicio es dueño de sus tablas. Un contenedor de base en vez de dos mantiene la operación simple para una sesión de pruebas presencial. |
| `entrenamiento` **no tiene forma de leer PII** | Es la garantía de §4.3. |

### 4.2 Contrato del token

Payload del JWT, firmado con `JWT_SECRET` compartido, expiración 2 h:

```json
{ "sub": "<uuid del participante>", "seq": 42, "role": "PARTICIPANT" }
```

`seq` es la novedad: hoy el seudónimo se resuelve por `join` con `Participant`.
Al llevarlo en el token, `entrenamiento` puede escribirlo en cada corrida sin
consultar jamás al servicio de identidad.

Sigue vigente la regla del doc actual §5: **el `participantId` sale siempre del
token, nunca del cuerpo.**

### 4.3 Por qué este corte y no otro

El corte no es por capas ni por tamaño: es por **sensibilidad del dato**.

- `identidad` es el único que conoce nombre, apellido, correo y cédula.
- `entrenamiento` conoce `participantId` (un uuid opaco) y `participantSeq` (el
  seudónimo del análisis). No tiene ninguna tabla, ninguna consulta y ninguna
  ruta de red que le permita obtener un nombre.

Consecuencia: `GET /api/runs/export.csv` **no puede** filtrar un dato personal
aunque alguien escriba mal un `select`. Hoy eso lo sostiene un `select` explícito
más una prueba unitaria; después lo sostiene la arquitectura. Es material directo
para los capítulos 4.1 (arquitectura general) y 4.6 (medidas de seguridad) del
documento final.

### 4.4 Costos que este corte introduce

Se declaran para que no aparezcan como sorpresa:

1. **Se pierde el `ON DELETE CASCADE`** de `Participant` → `ScenarioRun`. Para
   el estudio esto es correcto: borrar la identidad de un participante no debe
   borrar el dato que aportó. Pero deja de haber integridad referencial entre
   servicios, y un `participantId` huérfano ya no se detecta en la base.
2. **`pnpm anonimizar` deja de ser transversal.** Pasa a vivir solo en
   `identidad`: borra nombre/apellido/correo, destruye el `CEDULA_PEPPER` y
   marca `anonymizedAt`. `entrenamiento` no se toca porque no tiene nada que
   borrar — que es exactamente la propiedad que buscábamos.
3. **Dos servicios que operar** en el despliegue, dos health checks en CI, dos
   imágenes que construir.

### 4.5 Estructura del repositorio

Monorepo de NestJS (`nest generate app`), no dos carpetas duplicadas.

```
backend/
├── apps/
│   ├── identidad/
│   │   └── src/
│   │       ├── auth/           # registro, login, /me, JWT
│   │       ├── cedula/         # validador módulo 10 + HMAC
│   │       └── main.ts         # :3001
│   └── entrenamiento/
│       └── src/
│           ├── runs/           # POST /runs, /runs/me, /runs/progreso
│           ├── export/         # export.csv (ResearcherGuard)
│           └── main.ts         # :3002
├── libs/
│   └── comun/                  # JwtAuthGuard, @Participante(), ValidationPipe,
│                               # transform, ResearcherGuard
└── prisma/
    ├── identidad/schema.prisma
    ├── entrenamiento/schema.prisma
    ├── seed.mts                # cuenta de supervisor (identidad)
    └── anonimizar.mts          # cierre de recolección (identidad)
```

`libs/comun` contiene **solo** lo que ambos servicios necesitan de verdad: la
verificación del token, el decorador que extrae el participante, la
configuración del `ValidationPipe` y el helper de transformación. No es un cajón
de sastre: un archivo que solo usa un servicio vive en ese servicio.

Un `Dockerfile` por servicio (o uno con `--target`), dos servicios en
`docker-compose.yml`, una sola instalación de dependencias en la raíz de
`backend/`.

**Reglas de dependencia:** `apps/*` puede importar de `libs/comun`. `libs/comun`
nunca importa de `apps/*`. Un servicio nunca importa archivos internos del otro.

---

## 5. Modelo de datos

### 5.1 `schema identidad`

```prisma
enum Role { PARTICIPANT RESEARCHER }

model Participant {
  id  String @id @default(uuid())
  seq Int    @unique @default(autoincrement())

  // --- Datos personales: solo dan acceso. Nunca salen al análisis. ---
  // Nullables porque `pnpm anonimizar` los pone en null al cerrar la
  // recolección de datos.
  nombre   String?
  apellido String?
  email    String  @unique

  /// HMAC-SHA256(cédula normalizada, CEDULA_PEPPER). La cédula real NUNCA se
  /// guarda ni se puede recuperar de aquí. Su única función es garantizar
  /// una cuenta por persona. `anonimizar` destruye el pepper: sin él, el
  /// espacio de 10 dígitos deja de ser fuerza-bruteable y el hash queda
  /// anonimizado de verdad (NIST SP 800-188).
  cedulaHash String? @unique

  passwordHash      String
  role              Role      @default(PARTICIPANT)
  cohort            String?
  onboardingVistoAt DateTime?
  anonymizedAt      DateTime?
  createdAt         DateTime  @default(now())
}
```

Cambios respecto del schema actual: `+apellido`, `+cedulaHash`,
`+onboardingVistoAt`, **`−telefono`**, y `ScenarioRun` se va al otro schema.

`telefono` se elimina porque ya no se pide, no lo usa ninguna pantalla y guardar
un dato personal sin uso contradice §7 del documento de arquitectura. La
migración lo borra.

### 5.2 `schema entrenamiento`

```prisma
enum RunOutcome { CORRECTO PARCIAL INCORRECTO }

model ScenarioRun {
  id String @id @default(uuid())

  /// uuid opaco tomado del JWT. Sin llave foránea: este servicio no conoce
  /// la tabla Participant y no debe poder resolverla.
  participantId  String
  /// Número de orden del que se deriva el seudónimo del análisis (P001).
  /// Viene del JWT para no tener que consultar al servicio de identidad.
  participantSeq Int

  scenarioId String
  version    Int    @default(1)
  outcome    RunOutcome
  score      Int
  endingId   String
  durationMs Int
  decisions  Json   @default("[]")

  startedAt  DateTime
  finishedAt DateTime @default(now())

  @@index([participantId, scenarioId, finishedAt(sort: Desc)])
  @@index([scenarioId])
}
```

El índice compuesto con `finishedAt` descendente es lo que hace barata la
consulta de "última corrida por escenario" del gating (§7).

### 5.3 Migración de datos existentes

Se asume que **no hay datos de estudio que preservar** (la recolección no ha
empezado). La migración recrea los schemas. Si al momento de implementar
existieran corridas reales, se requiere un script de traspaso que copie
`ScenarioRun` al nuevo schema rellenando `participantSeq` desde `Participant.seq`
**antes** de eliminar la llave foránea.

---

## 6. Registro y cédula

### 6.1 Campos

| Campo | Validación |
|---|---|
| `nombre` | requerido, 2–60 caracteres |
| `apellido` | requerido, 2–60 caracteres |
| `cedula` | 10 dígitos, algoritmo módulo 10 (§6.2), única |
| `email` | `@IsEmail()`, único |
| `password` | mínimo 8 caracteres |

`POST /api/auth/register` responde `{ accessToken, participant }` directamente,
como hoy. Sin paso de verificación (§11).

### 6.2 Validación de la cédula ecuatoriana

Algoritmo del Registro Civil, implementado en `libs/comun` y **portado idéntico
al frontend** para dar retroalimentación inmediata:

1. Exactamente 10 dígitos.
2. Los dos primeros (código de provincia) entre `01` y `24`, o `30`
   (ecuatorianos registrados en el exterior).
3. Tercer dígito menor que `6` → persona natural.
4. Dígito verificador: a los 9 primeros se les aplican los coeficientes
   `2,1,2,1,2,1,2,1,2`; a cada producto ≥ 10 se le resta 9; el verificador es
   `(10 − suma mod 10) mod 10` y debe coincidir con el décimo dígito.

> **Límite declarado:** el módulo 10 detecta cédulas **inventadas**, no prueba
> identidad. Una cédula ajena pero válida pasa la validación. Es todo lo que se
> puede hacer sin consultar al Registro Civil, y es suficiente para el objetivo
> declarado —una cuenta por persona— que no es autenticación de identidad.

### 6.3 Almacenamiento

```
cedulaHash = HMAC-SHA256(cedula, CEDULA_PEPPER)
```

- `CEDULA_PEPPER` es un secreto de entorno de `identidad`, ≥ 32 bytes
  aleatorios. Vive junto a `JWT_SECRET` en `.env`, nunca en el repositorio.
- Se usa HMAC y no un hash simple **porque el espacio de cédulas es de 10
  dígitos**: un SHA-256 sin pepper se invierte por fuerza bruta en segundos. El
  pepper es lo que convierte el hash en irreversible.
- No se usa bcrypt porque el hash necesita ser **determinista** para servir de
  índice único.
- El valor en claro no se registra en logs, no se devuelve en ninguna respuesta
  y no existe endpoint que lo consulte.

### 6.4 Colisiones

Cédula ya registrada y correo ya registrado devuelven **el mismo error genérico
y el mismo tiempo de respuesta**, para no revelar quién está registrado
(consistente con la regla de login de `ARQUITECTURA.md` §7.5).

### 6.5 Impacto en el consentimiento informado

El consentimiento debe declarar, además de lo que ya dice:

- que se recoge la **cédula** con el único fin de evitar registros duplicados;
- que **no se almacena**: se guarda solo un código derivado del que no se puede
  reconstruir;
- que al cerrar el estudio ese código queda anonimizado de forma irreversible.

Esto contradice la regla actual de `ARQUITECTURA.md` §10 («Nada de cédula»). Esa
regla se reescribe como parte de F2 para reflejar la decisión y su
justificación, no se elimina en silencio.

---

## 7. Gating: 6 de 8

### 7.1 Regla

```
aprobado(escenario) = últimaCorrida(escenario)?.outcome === 'CORRECTO'
aprobado(módulo)    = |{ escenarios aprobados }| >= 6      (de 8)
```

- **Última** = mayor `finishedAt`. Reintentos ilimitados.
- **El último intento manda siempre.** Si un participante ya aprobado repite un
  escenario y falla, pierde ese escenario y puede bajar de 6/8. Es deliberado:
  el estado refleja lo que la persona demuestra ahora, no su mejor momento.
- `PARCIAL` **no** cuenta como aprobado. En un escenario de fraude, `PARCIAL`
  significa que dudó y entregó la clave igual. Reconocer a medias no es
  reconocer.
- En los escenarios **legítimos** el mapeo es el mismo: `CORRECTO` es verificar
  y actuar; tratar un caso legítimo como fraude y no actuar es `INCORRECTO`. Es
  lo que hace que el instrumento mida criterio y no desconfianza.

### 7.2 Endpoint

```
GET /api/runs/progreso/:modulo          (JWT)

200 → {
  "modulo": "phishing",
  "escenarios": [
    { "id": "phishing/factura-sri",   "ultimoOutcome": "CORRECTO" },
    { "id": "phishing/quishing-qr",   "ultimoOutcome": "INCORRECTO" }
  ],
  "aprobados": 5,
  "requeridos": 6,
  "aprobado": false
}
```

Solo aparecen los escenarios con al menos una corrida. Los que el participante
nunca intentó no vienen en la lista: el backend no conoce el catálogo, y el
frontend ya lo tiene.

Consulta: `SELECT DISTINCT ON ("scenarioId") … ORDER BY "scenarioId",
"finishedAt" DESC`, filtrada por `participantId` y prefijo `<modulo>/`.

**El total de 8 no se duplica en el backend.** El servicio declara únicamente el
umbral —`UMBRALES = { phishing: 6 }`— porque ese es el que debe ser
autoritativo del lado del servidor: un cliente modificado no puede aprobarse
solo. El denominador lo pone el frontend desde su catálogo, que es el único
lugar donde los 8 escenarios existen de verdad. Así no hay dos fuentes del
número 8 que puedan divergir en silencio, y el test de §9.3 protege la única
que hay.

### 7.3 Efecto en la interfaz

- **Dashboard:** la tarjeta de Phishing pasa de `listos/total` («completados») a
  `aprobados/8 · necesitas 6`, con insignia **Aprobado** cuando llega. Deja de
  usarse `fetchMyRuns()` para el conteo.
- **`Seccion.tsx`:** cada escenario muestra tres estados —aprobado / falta /
  sin intentar— derivados de `ultimoOutcome`. No revela la naturaleza del
  escenario a quien no lo jugó: sin intentar no muestra nada, y quien ya lo
  jugó ya recibió el debrief.
- ~~**Sin bloqueo de orden.** Los 8 escenarios siguen jugables en cualquier
  orden, como manda el diseño pedagógico. El 6/8 es una meta, no una puerta
  secuencial.~~ **Corregido en `2026-09-03-gamificacion-y-certificado-design.md`
  §4.1:** el código implementó desbloqueo secuencial (`lib/bloqueoEscenarios.ts`,
  `RequireEscenarioDisponible.tsx`) y ese spec resuelve la contradicción a favor
  del código — un público no técnico ante ocho tarjetas iguales no sabe por
  dónde entrar. Los 8 se ordenan por `dificultad` ascendente para que la
  secuencia sea una curva, no un orden arbitrario.

---

## 8. Pantalla de bienvenida

**Ruta:** `/bienvenida`.

**Cuándo aparece sola:** después de iniciar sesión, si
`participant.onboardingVistoAt === null`, `RequireAuth` redirige ahí antes del
dashboard.

**Contenido:**

1. Saludo con el nombre del participante.
2. Qué es cada tipo de engaño: los **seis**, en lenguaje llano. Se muestran los
   seis aunque solo phishing esté activo, para que la persona sepa qué está por
   venir; los cinco inactivos se marcan «Pronto».
3. Que **los escenarios son simulados y no conectan con ningún sistema real** —
   nada de lo que escriba ahí sale a internet.
4. Qué pasa con sus datos: para qué se usan, que la cédula no se almacena, y que
   todo se borra al cerrar el estudio.

**Salidas:**

- Checkbox **«No volver a mostrar»** → al continuar, `PATCH /api/auth/me
  { onboardingVisto: true }` y va al dashboard.
- Sin marcar → va al dashboard y vuelve a aparecer en el siguiente inicio de
  sesión.
- Botón **Continuar** siempre habilitado; nada obliga a marcar el checkbox.

**Acceso permanente:** ícono **ⓘ** en `AppHeader`, visible en toda la
aplicación, que abre `/bienvenida` esté marcado o no. Entrando por ahí, el
checkbox refleja el estado actual y permite volver a activar el aviso.

**Persistencia en base, no en `localStorage`:** el flag describe a la persona,
no al navegador. Con `localStorage`, un equipo compartido en una sesión
presencial mostraría u ocultaría la bienvenida a la persona equivocada.

`PATCH /api/auth/me` acepta **únicamente** `{ onboardingVisto: boolean }`. Con
`whitelist` + `forbidNonWhitelisted` activos, cualquier intento de tocar otro
campo del participante por esa ruta falla con 400.

---

## 9. Catálogo del MVP

### 9.1 Secciones

Las **seis secciones se quedan declaradas y visibles**. `Dashboard.tsx` ya
distingue las que no tienen escenarios y les pone la insignia «Pronto»
(`disponible = escenarios.length > 0`), así que no hace falta código nuevo: basta
comentar las entradas de escenario de las otras cinco secciones en el array
`BASE` de `frontend/src/data/catalogo.ts`.

Los archivos `.tsx` de esos escenarios **quedan intactos en el repositorio**. Se
reactivan descomentando su entrada del catálogo.

Rutas: se generan desde el catálogo, así que las de los escenarios comentados
desaparecen solas. `App.tsx` no se toca.

### 9.2 Los 8 escenarios de phishing

Tomados del diseño pedagógico
(`docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md` §4).

| # | id | Naturaleza | Dificultad | Espeja | Origen | Estado |
|---|---|---|---|---|---|---|
| 1 | `phishing/factura-sri` | fraude | 2 | `rol-de-pagos` | P1 | existe |
| 2 | `phishing/clave-caducada` | fraude | 3 | `rol-de-pagos` | previo | existe |
| 3 | `phishing/quishing-qr` | fraude | 3 | — | P2 | **nuevo** |
| 4 | `phishing/inicio-sesion-bogota` | fraude | 4 | — | P3 | **nuevo** |
| 5 | `phishing/cobro-dirigido` | fraude | 4 | `filtracion-real` | P4 | **nuevo** |
| 6 | `phishing/hilo-secuestrado` | fraude | 5 | — | P5 | **nuevo** |
| 7 | `phishing/rol-de-pagos` | legítimo | 3 | `clave-caducada` | previo | existe |
| 8 | `phishing/filtracion-real` | legítimo | 4 | `cobro-dirigido` | L-P2 | **nuevo** |

Cinco nuevos, cero retirados. `L-P1` (aviso de vencimiento de tarjeta) queda
fuera del MVP: `rol-de-pagos` ya cubre el papel de legítimo espejo de un
escenario de credenciales.

Cada escenario nuevo sigue el contrato de `ARQUITECTURA.md` §4: entrada en el
catálogo con `lazy()`, componente en `frontend/src/secciones/phishing/`, registro
de corrida por `useStoryEngine` (o `useScenarioRun` si su mecánica lo exige — el
quishing necesita un simulador de escaneo), tres finales mapeados a los tres
`outcome`, y debrief con señales reveladas y regla de oro.

### 9.3 Cambio en `catalogo.test.ts`

La prueba «ninguna sección queda sin escenarios» deja de aplicar: ahora es un
estado deliberado. Se reemplaza por la que codifica la regla del gating:

```ts
it('phishing tiene exactamente 8 escenarios: 6 de fraude y 2 legítimos', () => {
  const phishing = escenariosDeSeccion('phishing')
  expect(phishing).toHaveLength(8)
  expect(phishing.filter((e) => e.naturaleza === 'fraude')).toHaveLength(6)
  expect(phishing.filter((e) => e.naturaleza === 'legitimo')).toHaveLength(2)
})
```

Si alguien agrega un noveno escenario, el «6 de 8» deja de significar lo que
dice y la prueba lo atrapa antes del despliegue.

Las demás pruebas del archivo (formato de id, ids únicos, sección declarada,
espejos existentes, versión entera) se conservan sin cambio.

---

## 10. Sistema de diseño: verde `#006837`

### 10.1 Tokens

```css
@theme {
  /* Marca */
  --color-primary:        #006837;   /* era #000000 */
  --color-primary-active: #00522b;   /* era #1a1a1a */
  --color-on-primary:     #ffffff;
  --color-link:           #006837;   /* era #0d74ce */

  /* Ambiente: solo detrás del hero de acceso */
  --color-mint-light: #d9ede2;       /* era --color-sky-light #cfe7ff */
  --color-mint-mid:   #a9d1ba;       /* era --color-sky-mid   #a8c8e8 */

  /* Sin cambio */
  --color-ink: #171717;  --color-body: #60646c;
  --color-success: #16a34a;  --color-danger: #b4342f;  --color-warning: #ab6400;
}
```

Contraste `#006837` sobre blanco: **6.8:1** — cumple AA para texto normal y AAA
para texto grande. Blanco sobre `#006837`: el mismo 6.8:1. `#00522b` sobre
blanco: 9.4:1.

### 10.2 Alcance del cambio en el código

Todo el color pasa por tokens de Tailwind, así que el repaint es:

- `frontend/src/index.css` — 6 valores.
- `frontend/src/components/AuthLayout.tsx` — 1 línea (`from-sky-light` →
  `from-mint-light`).

Ningún otro componente se toca. Los `.module.css` de los escenarios simulan apps
de terceros y **no** usan estos tokens: quedan como están.

### 10.3 Reglas de `DESIGN.md` que cambian

| Regla actual | Nueva |
|---|---|
| «Negro es el único relleno de acción.» | **`primary` (#006837) es el único relleno de acción.** Se sigue usando con moderación: una acción primaria por pantalla. |
| «No poner azul (`text-link`) en un botón.» | Enlace y botón comparten hex, así que la regla pasa a ser de forma: **los enlaces en texto van siempre subrayados; verde sin subrayar es un botón.** |
| Tokens `sky-light` / `sky-mid` | Renombrados a `mint-light` / `mint-mid`. Siguen siendo solo del degradado del hero de acceso, en ningún otro lugar. |

`success` se mantiene en `#16a34a`, deliberadamente distinto de la marca: en una
aplicación donde verde significa «acertaste», el verde de retroalimentación no
puede ser el mismo verde del cromo. §7 de `DESIGN.md` ya exige que el color
nunca sea la única señal, lo que cubre el resto del riesgo.

---

## 11. Diferido: certificado

> **Implementado con un diseño distinto al de esta sección** —
> `2026-09-03-gamificacion-y-certificado-design.md` §5. Se deja el texto
> original por su valor histórico, con lo que cambió anotado en cada punto.

Se construye después de F4, en su propia fase, y arrastra consigo:

- ~~Servicio **`certificados` (:3003)**: genera el PDF con `pdfkit` (no un
  navegador headless: añadiría cientos de MB al contenedor). Consulta a
  `entrenamiento` el progreso y a `identidad` el nombre. Tabla `Certificate` con
  `codigo` verificable y `revocadoAt`.~~ **Descartado:** un tercer servicio que
  llamara a `entrenamiento` por red viola §2 de `ARQUITECTURA.md` (los
  servicios no se llaman entre sí). `identidad` genera el PDF con `pdfkit`
  (eso sí se mantiene) a partir de una **atestación firmada por
  `entrenamiento`** que el cliente lleva de un servicio a otro — la tabla
  `Certificate` vive en `identidad`.
- ~~Servicio **`notificaciones` (:3004)**: única salida SMTP del sistema, con
  cola de reintento. Se justifica cuando hay **dos** productores de correo; con
  uno solo sería un contenedor de más.~~ **Descartado por el propio criterio
  de este punto:** sin envío por correo, hay cero productores, no dos.
- ~~**Verificación de correo por código** al registrarse (…).~~ **Descartada:**
  su razón de ser era garantizar que el certificado llegara por correo. Con
  descarga en la aplicación, un correo con typo ya no impide que el
  participante tenga su certificado.
- **Revocación:** ~~si un participante ya certificado repite un escenario y
  baja de 6/8, la aplicación marca `revocadoAt` y deja de ofrecer la
  descarga.~~ **No es implementable así:** `identidad` no tiene forma de
  enterarse de que alguien bajó de umbral sin llamar a `entrenamiento`, y eso
  rompería §2. Se sustituye por exigir una atestación fresca en cada descarga
  (quien bajó de umbral no la consigue) más `revocadoAt` como acción manual de
  un supervisor. El PDF ya descargado no se persigue — no se promete lo
  imposible.
- El PDF **no se persiste**: se regenera de la fila de `Certificate` más el
  nombre pedido a `identidad`. Guardarlo crearía un archivo con datos personales
  en disco, reabriendo el problema que el diseño de la cédula acaba de cerrar.

---

## 12. Pruebas

Cada fase deja verificación ejecutable. Nada de suites exhaustivas; una prueba
por regla que, si se rompe, arruina el estudio en silencio.

| Fase | Qué se verifica |
|---|---|
| F0 | Visual. No hay lógica que probar; `pnpm build` y `pnpm lint` bastan. |
| F1 | La prueba existente de que `export.csv` no lleva PII se conserva y ahora es trivialmente cierta. Se agrega una e2e por servicio: `identidad` emite un JWT con `seq`, y `entrenamiento` lo acepta sin llamar a `identidad`. Las e2e actuales (`auth`, `runs`, `throttling`) se reparten entre los dos servicios. |
| F2 | Unitaria del validador de cédula: casos válidos reales, provincia fuera de rango, tercer dígito ≥ 6, verificador incorrecto, longitud distinta de 10. Unitaria de que `cedulaHash` es determinista con el mismo pepper y distinto con otro. E2e: dos registros con la misma cédula → el segundo falla con el error genérico. |
| F3 | Unitaria del gating: 8 escenarios, corridas en desorden temporal, y la última corrida de cada uno es la que cuenta —incluido el caso de repetir un escenario aprobado y fallar, que debe bajar el conteo. E2e: `PATCH /api/auth/me` con un campo no declarado → 400. |
| F4 | El test de catálogo de §9.3, más las reglas de contrato ya existentes para cada escenario nuevo. |

---

## 13. Documentos a actualizar

Parte de la implementación, no trabajo aparte:

| Documento | Qué cambia | Fase |
|---|---|---|
| `docs/DESIGN.md` | Tokens de marca, reglas de §2 y §10, tabla de §9 | F0 |
| `docs/ARQUITECTURA.md` §2, §3 | Topología de dos servicios, estructura del monorepo | F1 |
| `docs/ARQUITECTURA.md` §5, §6 | Contrato del API por servicio, dos schemas | F1 |
| `docs/ARQUITECTURA.md` §7, §10 | Registro con cédula, HMAC + pepper, retiro de la prohibición con su justificación | F2 |
| `docs/ARQUITECTURA.md` §4, §11, §12 | Regla del 6/8, decisiones cerradas, estado actual | F3 |
| `README.md` | Registro, comandos de los dos servicios, `CEDULA_PEPPER` en `.env.example` | F1–F2 |
| `.github/workflows/ci.yml` | Build y prueba de dos aplicaciones, dos imágenes Docker | F1 |
| Consentimiento informado | Cláusula de la cédula (§6.5) | F2 |
