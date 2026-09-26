# Mejorar envío de correos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El registro exige confirmar el correo (link de un solo uso) antes de
poder iniciar sesión, mismo mecanismo que ya usa recuperación de clave; los
tres correos del sistema (confirmación, recuperación de clave, certificado)
comparten una plantilla visual con la paleta de marca de la app.

**Architecture:** `Participant` gana tres columnas (`emailConfirmedAt`,
`emailConfirmationTokenHash`, `emailConfirmationExpiresAt`), mismo patrón que
ya existe para el token de recuperación de clave. `AuthService.register()` ya
no arma sesión: crea la cuenta sin confirmar y manda el correo;
`AuthService.login()` la rechaza si es `PARTICIPANT` y no confirmó.
`MailService` gana un helper de plantilla compartido y un tercer método de
envío. En el frontend, `Registro.tsx` navega a una pantalla de "revisa tu
correo" en vez de entrar directo, y una página nueva consume el link del
correo.

**Tech Stack:** NestJS + Prisma (backend `identidad`), React 19 + TypeScript
+ Vitest (frontend), Jest (backend), Resend (envío de correo).

**Spec:** `docs/superpowers/specs/2026-09-25-mejorar-envio-de-correos-design.md`

## Global Constraints

- Link, no código, en los dos flujos (recuperación y confirmación).
- El registro bloquea el acceso hasta confirmar; solo aplica a
  `role === 'PARTICIPANT'` (`TRAINER`/`ADMIN` no nacen confirmados, pero no se les exige confirmar para iniciar sesión).
- Cuentas existentes quedan confirmadas automáticamente en la migración
  (`emailConfirmedAt = now()` para toda fila `PARTICIPANT` con el campo nulo).
- Token de confirmación: 24 horas de vigencia (vs. 30 minutos del de
  recuperación de clave).
- Reenviar confirmación responde igual exista o no la cuenta, o ya esté
  confirmada — mismo principio que `forgotPassword` (issue #256): nunca
  delata qué correos están registrados.
- La plantilla de correo usa la paleta de la app en pantalla
  (`docs/DESIGN.md`: `--color-primary #006837`, tinta `#171717`, fondo
  `#f7f7f8`, borde `#e6e6ea`) — **no** la paleta ornamentada del PDF del
  certificado (dorado/crema), que es exclusiva del documento impreso.
- CSS inline en el HTML del correo (nunca `<style>` en `<head>`: varios
  clientes de correo lo recortan). Los tres correos mantienen su versión en
  texto plano.
- Sin librería nueva de plantillas (MJML, react-email): un helper propio
  alcanza para tres correos.

---

## Task 1: Esquema — columnas de confirmación de correo + migración con backfill

**Files:**
- Modify: `backend/prisma/identidad/schema.prisma` (modelo `Participant`,
  líneas ~93-96, entre `passwordResetExpiresAt` y `tokenVersion`)
- Create: `backend/prisma/identidad/migrations/<timestamp>_agregar_confirmacion_correo/migration.sql`

**Interfaces:**
- Produces: columnas `emailConfirmedAt DateTime?`,
  `emailConfirmationTokenHash String? @unique`,
  `emailConfirmationExpiresAt DateTime?` en `Participant`, que las Tasks 3 y 4
  leen/escriben vía Prisma.

- [ ] **Step 1: Agregar los tres campos al schema**

En `backend/prisma/identidad/schema.prisma`, entre el bloque de
`passwordResetExpiresAt` y `tokenVersion` (dentro de `model Participant`):

```prisma
  /// Vence a los 30 minutos de pedirse (ver PASSWORD_RESET_EXPIRES_MS en
  /// auth.service.ts). Null cuando no hay ningún restablecimiento pendiente.
  passwordResetExpiresAt DateTime?

  /// Null = pendiente de confirmar el correo. Con fecha = ya confirmó (o la
  /// cuenta se creó antes de este cambio y la migración la marcó
  /// confirmada). Solo aplica a PARTICIPANT: TRAINER/ADMIN nacen
  /// confirmados, los da de alta alguien del equipo a mano.
  emailConfirmedAt DateTime?

  /// Hash SHA-256 del token de un solo uso para confirmar el correo, mismo
  /// patrón que passwordResetTokenHash.
  emailConfirmationTokenHash String? @unique

  /// Vence a las 24 horas de pedirse (confirmar cuenta es menos urgente que
  /// resetear una clave comprometida). Null cuando no hay ninguna
  /// confirmación pendiente.
  emailConfirmationExpiresAt DateTime?

  /// Se incrementa al restablecer la contraseña. El refresh token lleva la
  /// versión con la que se emitió; si no coincide con esta, `refreshSession`
  /// lo rechaza, así un restablecimiento cierra las sesiones ya abiertas en
  /// otros dispositivos sin necesitar una lista de tokens revocados.
  tokenVersion Int @default(0)
```

- [ ] **Step 2: Generar la migración sin aplicarla, para poder editar el SQL**

Run (desde `backend/`):
```bash
pnpm exec prisma migrate dev --name agregar_confirmacion_correo --config prisma.identidad.config.ts --create-only
```
Expected: crea `backend/prisma/identidad/migrations/<timestamp>_agregar_confirmacion_correo/migration.sql`
con las tres columnas `ALTER TABLE`, sin tocar la base todavía.

- [ ] **Step 3: Agregar el backfill al SQL generado**

Al final del archivo `migration.sql` recién creado (después de los
`ALTER TABLE` que Prisma generó), agregar:

```sql

-- Las cuentas que ya existían antes de este cambio nunca pasaron por un
-- flujo de confirmación (no existía), así que quedan confirmadas de una:
-- nadie que ya usa la app se queda afuera por una regla que se agregó
-- después de su registro. Se filtra por Role='PARTICIPANT' porque
-- TRAINER/ADMIN no nacen confirmados (no se les setea emailConfirmedAt al
-- crearse), pero tampoco se les exige confirmar para iniciar sesión (ver
-- el filtro por rol en AuthService.login), así que no hace falta tocarlos
-- aquí aunque tengan el campo nulo.
UPDATE "Participant"
SET "emailConfirmedAt" = now()
WHERE "role" = 'PARTICIPANT' AND "emailConfirmedAt" IS NULL;
```

- [ ] **Step 4: Aplicar la migración**

Run (desde `backend/`):
```bash
pnpm exec prisma migrate dev --config prisma.identidad.config.ts
```
Expected: aplica la migración pendiente sin pedir un nombre nuevo (ya existe
el archivo), y regenera el cliente de Prisma. Confirmar en la salida que dice
algo como "Applying migration `<timestamp>_agregar_confirmacion_correo`" y
termina sin error.

- [ ] **Step 5: Confirmar que el backfill corrió**

Run (desde `backend/`, con la base de desarrollo ya migrada):
```bash
pnpm exec prisma studio --config prisma.identidad.config.ts &
```
o, más simple, una consulta directa si `psql` está a mano contra
`IDENTIDAD_DATABASE_URL`:
```sql
SELECT count(*) FROM "Participant" WHERE role = 'PARTICIPANT' AND "emailConfirmedAt" IS NULL;
```
Expected: `0` (todas las cuentas `PARTICIPANT` existentes quedaron con
`emailConfirmedAt` no nulo). Si el entorno no tiene una base de desarrollo
con filas previas, no hay nada que verificar aquí más allá de que el UPDATE
no haya fallado al aplicarse (Step 4 ya lo confirma).

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/identidad/schema.prisma backend/prisma/identidad/migrations/
git commit -m "feat(identidad): agregar columnas de confirmación de correo"
```

---

## Task 2: Plantilla de correo compartida + tercer método de envío

**Files:**
- Create: `backend/apps/identidad/src/mail/plantilla.ts`
- Create: `backend/apps/identidad/src/mail/plantilla.spec.ts`
- Modify: `backend/apps/identidad/src/mail/mail.service.ts` (los tres
  métodos: `sendCertificate`, `sendPasswordReset`, y el nuevo
  `sendEmailConfirmation`)
- Modify: `backend/apps/identidad/src/mail/mail.service.spec.ts` (agregar
  `describe('MailService.sendEmailConfirmation', ...)`; los tests existentes
  de `sendCertificate`/`sendPasswordReset` deben seguir pasando con la
  plantilla nueva envolviendo el HTML — actualizar sus aserciones sobre
  `received?.html` si comparaban el HTML completo en vez de con `.toContain`)

**Interfaces:**
- Produces: `emailLayout(tituloVisible: string, cuerpoHtml: string): string`
  (exportado de `plantilla.ts`), y
  `MailService.sendEmailConfirmation(email: string, name: string, confirmLink: string): Promise<boolean>`
  — misma forma que `sendPasswordReset`.

- [ ] **Step 1: Escribir el test que falla, para `emailLayout`**

```typescript
// backend/apps/identidad/src/mail/plantilla.spec.ts
import { emailLayout } from './plantilla';

describe('emailLayout', () => {
  it('envuelve el cuerpo con el título visible y la paleta de la app', () => {
    const html = emailLayout('Confirma tu correo', '<p>Hola, Ana.</p>');

    expect(html).toContain('<p>Hola, Ana.</p>');
    expect(html).toContain('Confirma tu correo');
    // Paleta de docs/DESIGN.md, no la del PDF del certificado.
    expect(html).toContain('#006837');
    // CSS inline, nunca <style> en <head>: varios clientes de correo lo recortan.
    expect(html).not.toContain('<style');
  });

  it('no revienta con HTML que ya trae etiquetas propias en el cuerpo', () => {
    const html = emailLayout('Título', '<p>Con <a href="https://x.com">un link</a> adentro.</p>');

    expect(html).toContain('<a href="https://x.com">un link</a>');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd backend && pnpm test plantilla -- --testPathPattern=identidad`
Expected: FAIL — `Cannot find module './plantilla'`

- [ ] **Step 3: Implementar `emailLayout`**

```typescript
// backend/apps/identidad/src/mail/plantilla.ts

/// Paleta de docs/DESIGN.md (sistema en pantalla), NO la del PDF del
/// certificado: esa es deliberadamente más ornamentada (dorado, crema) y
/// está reservada para el documento impreso (ver certificados/pdf.ts).
const PRIMARY = '#006837';
const INK = '#171717';
const CANVAS = '#f7f7f8';
const HAIRLINE = '#e6e6ea';
const MUTED = '#63676e';

/// Envuelve el cuerpo de un correo con encabezado, pie de página y la
/// paleta de marca. CSS inline a propósito: Gmail y otros clientes recortan
/// <style> en <head>, así que un bloque de estilos no llega a aplicarse de
/// forma confiable.
export function emailLayout(tituloVisible: string, cuerpoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${CANVAS};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CANVAS};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 16px 24px;border-bottom:1px solid ${HAIRLINE};">
                <span style="color:${PRIMARY};font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">SAFE-Web</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:${INK};font-size:16px;line-height:1.5;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:${INK};">${tituloVisible}</h1>
                ${cuerpoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid ${HAIRLINE};color:${MUTED};font-size:12px;">
                Este correo es automático; no respondas directamente a él.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd backend && pnpm test plantilla -- --testPathPattern=identidad`
Expected: PASS (2 tests)

- [ ] **Step 5: Escribir el test que falla, para `sendEmailConfirmation`**

Agregar a `backend/apps/identidad/src/mail/mail.service.spec.ts` (mismo
archivo, mismo `sendMock`/`fakeConfig` ya definidos arriba):

```typescript
describe('MailService.sendEmailConfirmation', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('manda el enlace de confirmación sin adjuntos cuando Resend no reporta error', async () => {
    let received:
      | { to: string; html: string; text?: string; attachments?: unknown }
      | undefined;
    sendMock.mockImplementation(
      (payload: {
        to: string;
        html: string;
        text?: string;
        attachments?: unknown;
      }) => {
        received = payload;
        return Promise.resolve({ data: { id: 'abc' }, error: null });
      },
    );
    const mail = new MailService(fakeConfig());
    const link = 'https://safe-web.site/confirmar-correo?token=abc123';

    const sent = await mail.sendEmailConfirmation('ana@gmail.com', 'Ana', link);

    expect(sent).toBe(true);
    expect(received?.to).toBe('ana@gmail.com');
    expect(received?.html).toContain(link);
    expect(received?.attachments).toBeUndefined();
    expect(received?.text).toContain(link);
  });

  it('devuelve false y no lanza cuando Resend reporta error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'dominio no verificado' },
    });
    const mail = new MailService(fakeConfig());

    const sent = await mail.sendEmailConfirmation(
      'ana@gmail.com',
      'Ana',
      'https://safe-web.site/confirmar-correo?token=abc123',
    );

    expect(sent).toBe(false);
  });
});
```

- [ ] **Step 6: Correr el test y verificar que falla**

Run: `cd backend && pnpm test mail.service -- --testPathPattern=identidad`
Expected: FAIL — `mail.sendEmailConfirmation is not a function`

- [ ] **Step 7: Implementar `sendEmailConfirmation` y envolver los tres métodos con `emailLayout`**

Reemplazar el contenido completo de
`backend/apps/identidad/src/mail/mail.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { emailLayout } from './plantilla';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get('MAIL_FROM', 'SAFE-Web <noreply@luis-sagx.xyz>');
  }

  async sendCertificate(
    email: string,
    name: string,
    pdf: Buffer,
  ): Promise<boolean> {
    const html = emailLayout(
      'Tu certificado SAFE-Web',
      `<p>Hola ${name}, adjunto tu certificado del entrenamiento SAFE-Web.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Tu certificado SAFE-Web',
      html,
      attachments: [{ filename: 'certificado-safe-web.pdf', content: pdf }],
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar certificado a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }

  async sendPasswordReset(
    email: string,
    name: string,
    resetLink: string,
  ): Promise<boolean> {
    const text = `Hola ${name}, alguien pidió restablecer tu contraseña de SAFE-Web.

Elige una contraseña nueva aquí: ${resetLink}

Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.
El enlace vence en 30 minutos.`;

    const html = emailLayout(
      'Restablecer tu contraseña',
      `<p>Hola ${name}, alguien pidió restablecer tu contraseña de SAFE-Web.</p>
<p><a href="${resetLink}" style="color:#006837;">Elegir una contraseña nueva</a></p>
<p>Si no fuiste tú, ignora este correo: tu contraseña sigue siendo la misma.</p>
<p>El enlace vence en 30 minutos.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Restablecer tu contraseña',
      html,
      text,
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar el restablecimiento a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }

  /// Sin cola de reintento, mismo criterio que los otros dos: si Resend
  /// falla, quien llama (AuthService.register) responde el mismo mensaje
  /// genérico igual, y hay un botón de "reenviar" en el frontend.
  async sendEmailConfirmation(
    email: string,
    name: string,
    confirmLink: string,
  ): Promise<boolean> {
    const text = `Hola ${name}, gracias por crear tu cuenta en SAFE-Web.

Confirma tu correo aquí: ${confirmLink}

El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.`;

    const html = emailLayout(
      'Confirma tu correo',
      `<p>Hola ${name}, gracias por crear tu cuenta en SAFE-Web.</p>
<p><a href="${confirmLink}" style="color:#006837;">Confirmar mi correo</a></p>
<p>El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>`,
    );

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Confirma tu correo en SAFE-Web',
      html,
      text,
    });

    if (error) {
      this.logger.warn(
        `No se pudo enviar la confirmación a ${email}: ${error.message}`,
      );
      return false;
    }

    return true;
  }
}
```

- [ ] **Step 8: Correr los tests de `mail.service.spec.ts` y verificar que todos pasan**

Run: `cd backend && pnpm test mail.service -- --testPathPattern=identidad`
Expected: PASS. Si algún test existente de `sendCertificate`/`sendPasswordReset`
comparaba `received.html` con `toBe(...)` (igualdad exacta) en vez de
`toContain(...)`, ajustarlo a `toContain` ahora que el HTML trae la plantilla
alrededor — el contenido específico del correo (el link, el nombre) sigue
estando, solo cambia lo que lo envuelve.

- [ ] **Step 9: Commit**

```bash
git add backend/apps/identidad/src/mail/plantilla.ts backend/apps/identidad/src/mail/plantilla.spec.ts backend/apps/identidad/src/mail/mail.service.ts backend/apps/identidad/src/mail/mail.service.spec.ts
git commit -m "feat(identidad): plantilla de correo compartida + envío de confirmación"
```

---

## Task 3: `AuthService.register()` sin sesión + `login()` exige correo confirmado

**Files:**
- Modify: `backend/apps/identidad/src/auth/auth.service.ts`
- Modify: `backend/apps/identidad/src/auth/auth.service.spec.ts`
- Modify: `backend/apps/identidad/src/auth/auth.controller.ts` (método `register`)
- Modify: `backend/apps/identidad/src/auth/auth.controller.spec.ts`

**Interfaces:**
- Consumes: `MailService.sendEmailConfirmation(email, name, confirmLink): Promise<boolean>` (Task 2)
- Produces: `AuthService.register(dto: RegisterDto): Promise<{ email: string }>`
  (ya NO `Promise<Session>`). `AuthController.register(...)` responde
  `{ email: string }`, sin poner la cookie de refresh.

- [ ] **Step 1: Escribir el test que falla, para `register` sin sesión**

En `backend/apps/identidad/src/auth/auth.service.spec.ts`, dentro de
`describe('AuthService.register', ...)`, reemplazar el test
`'la sesión devuelta trae el nombre y el correo descifrados'` por:

```typescript
  it('no arma sesión: crea la cuenta sin confirmar y manda el correo de confirmación', async () => {
    let createdData: Record<string, unknown> | undefined;
    const sendEmailConfirmation = jest.fn().mockResolvedValue(true);
    const auth = service(
      {
        findFirst: () => Promise.resolve(null),
        create: ({ data }: { data: Record<string, unknown> }) => {
          createdData = data;
          return Promise.resolve(participantRow(data));
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    const result = await auth.register(registrationDto());

    expect(result).toEqual({ email: 'ana@correo.com' });
    expect(createdData?.emailConfirmedAt).toBeUndefined();
    expect(sendEmailConfirmation).toHaveBeenCalledTimes(1);
    const [emailArg, , linkArg] = sendEmailConfirmation.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(emailArg).toBe('ana@correo.com');
    expect(linkArg).toContain('/confirmar-correo?token=');
  });
```

(Dejar los demás tests de `describe('AuthService.register', ...)` —
`'cifra nombre, apellido y correo...'`, `'rechaza un correo o cédula ya
registrados...'`, los dos de P2002 — tal cual están: siguen probando
comportamiento que no cambia. `fakeMail()` ya existe arriba del archivo con
`sendPasswordReset` por defecto; agregarle `sendEmailConfirmation` a su
objeto de retorno con el mismo patrón.)

Actualizar `fakeMail` (arriba del archivo, cerca de la línea 46):

```typescript
function fakeMail(overrides: Record<string, unknown> = {}) {
  return {
    sendPasswordReset: () => Promise.resolve(true),
    sendEmailConfirmation: () => Promise.resolve(true),
    ...overrides,
  } as never;
}
```

**Importante, antes de lo demás:** el helper `participantRow()` (definido
cerca de la línea 69, usado por TODOS los tests del archivo) hoy no
establece `emailConfirmedAt` en absoluto, así que una vez que `login()`
compruebe ese campo, los tests ya existentes que arman una fila con
`participantRow()` y esperan que el login funcione (`'con todo correcto,
entrega la sesión'`, y los nuevos que agrega esta task) empezarían a fallar
por rechazo de "correo no confirmado" en vez de por lo que de verdad prueban.
Corregir `participantRow()` para que nazca confirmada por defecto:

```typescript
function participantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    seq: 7,
    nombre: encrypt('Ana', PII_KEY),
    apellido: encrypt('Pérez', PII_KEY),
    email: encrypt('ana@correo.com', PII_KEY),
    role: 'PARTICIPANT',
    onboardingVistoAt: null,
    disabledAt: null,
    tokenVersion: 0,
    // Confirmada por defecto: los tests que necesitan probar el camino de
    // "no confirmada" la pisan explícitamente con `emailConfirmedAt: null`.
    emailConfirmedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
```

Y agregar los dos tests nuevos dentro de `describe('AuthService.login', ...)`,
con el mismo patrón de bcrypt real que ya usan `'una cuenta desactivada no
entra...'` y `'con todo correcto, entrega la sesión'` (líneas ~187-221 del
archivo actual):

```typescript
  it('rechaza a un PARTICIPANT que no confirmó su correo', async () => {
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findFirst: () =>
        Promise.resolve({
          ...participantRow({ emailConfirmedAt: null }),
          passwordHash,
        }),
    });

    await expect(
      auth.login({ email: 'ana@correo.com', password: 'ClaveSegura123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('una cuenta TRAINER o ADMIN sin emailConfirmedAt sí entra (no aplica el bloqueo)', async () => {
    const passwordHash = await hash('ClaveSegura123!', 4);
    const auth = service({
      findFirst: () =>
        Promise.resolve({
          ...participantRow({ role: 'ADMIN', emailConfirmedAt: null }),
          passwordHash,
        }),
    });

    const session = await auth.login({
      email: 'ana@correo.com',
      password: 'ClaveSegura123!',
    });

    expect(session.accessToken).toEqual(expect.any(String));
  });
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `cd backend && pnpm test auth.service -- --testPathPattern=identidad`
Expected: FAIL — el test de `register` falla porque `result` sigue siendo una
sesión completa (`accessToken`/`refreshToken`), no `{ email }`; los dos de
`login` fallan porque hoy no existe ninguna comprobación de
`emailConfirmedAt`.

- [ ] **Step 3: Implementar en `auth.service.ts`**

Agregar la constante de expiración, cerca de `RESET_TOKEN_TTL_MS` (línea
~40):

```typescript
/// 24 horas: confirmar cuenta es menos urgente que resetear una clave
/// comprometida (30 minutos), pero no debe quedar vigente indefinidamente.
const EMAIL_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

/// Un solo mensaje: no hace falta distinguir "nunca confirmaste" de
/// cualquier otra causa de rechazo del lado del participante.
const EMAIL_NOT_CONFIRMED =
  'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja o pide que te lo reenviemos.';
```

Reemplazar el método `register` completo:

```typescript
  async register(dto: RegisterDto): Promise<{ email: string }> {
    const ecuadorianIdHash = hashEcuadorianId(
      dto.cedula,
      this.ecuadorianIdPepper,
    );
    const emailHash = hashEmail(dto.email, this.emailPepper);

    const alreadyExists = await this.prisma.participant.findFirst({
      where: {
        OR: [
          { emailHash },
          { email: dto.email },
          { cedulaHash: ecuadorianIdHash },
        ],
      },
      select: { id: true },
    });

    if (alreadyExists) {
      throw new ConflictException(ALREADY_REGISTERED);
    }

    // El token viaja en claro solo por correo; en la base se guarda su hash
    // (mismo criterio que el de recuperación de clave, ver hashToken más
    // abajo — Task 4 lo renombra de hashResetToken).
    const confirmationToken = randomBytes(RESET_TOKEN_BYTES).toString(
      'base64url',
    );

    try {
      await this.prisma.participant.create({
        data: {
          nombre: encrypt(dto.nombre, this.piiKey),
          apellido: encrypt(dto.apellido, this.piiKey),
          email: encrypt(dto.email, this.piiKey),
          emailHash,
          cedulaHash: ecuadorianIdHash,
          passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
          emailConfirmationTokenHash: hashResetToken(confirmationToken),
          emailConfirmationExpiresAt: new Date(
            Date.now() + EMAIL_CONFIRMATION_TTL_MS,
          ),
        },
        select: SESSION_FIELDS,
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(ALREADY_REGISTERED);
      }
      throw error;
    }

    const link = `${this.frontendOrigin}/confirmar-correo?token=${confirmationToken}`;
    await this.mail.sendEmailConfirmation(dto.email, dto.nombre, link);

    return { email: dto.email };
  }
```

Nota: `hashResetToken` sigue llamándose así en este task (Task 4 lo renombra
a `hashToken` cuando lo reutiliza para `confirmEmail`/`resendConfirmation`;
no lo renombres todavía acá para no generar un conflicto de merge con esa
tarea — el nombre es un detalle interno, no una interfaz que otro task
consuma).

Modificar `login` — agregar la comprobación justo después de la de
`disabledAt` (antes del `return this.session(participant)` final):

```typescript
    if (participant.disabledAt) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al supervisor del estudio.',
      );
    }

    if (participant.role === 'PARTICIPANT' && !participant.emailConfirmedAt) {
      throw new UnauthorizedException(EMAIL_NOT_CONFIRMED);
    }

    return this.session(participant);
```

Esto exige agregar `emailConfirmedAt: true` al `select` de `login` (el mismo
`{ ...SESSION_FIELDS, passwordHash: true, disabledAt: true }` de la línea
~215) — cambiarlo a
`{ ...SESSION_FIELDS, passwordHash: true, disabledAt: true, emailConfirmedAt: true }`.

- [ ] **Step 4: Actualizar el controller**

En `backend/apps/identidad/src/auth/auth.controller.ts`, el método
`register` ya no pone la cookie de refresh (no hay sesión):

```typescript
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ email: string }> {
    return this.auth.register(dto);
  }
```

(Se elimina el `@Res({ passthrough: true }) res: Response` de la firma junto
con la llamada a `this.setRefreshCookie(...)`, ya que no aplica más aquí.)

- [ ] **Step 5: Actualizar el test del controller**

En `backend/apps/identidad/src/auth/auth.controller.spec.ts`, reemplazar
`describe('AuthController.register', ...)`:

```typescript
describe('AuthController.register', () => {
  it('delega en el servicio y devuelve solo el correo, sin poner cookie', async () => {
    const service = {
      register: () => Promise.resolve({ email: 'ana@correo.com' }),
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.register({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@correo.com',
      cedula: '1710034065',
      password: 'ClaveSegura123!',
    } as never);

    expect(result).toEqual({ email: 'ana@correo.com' });
  });
});
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `cd backend && pnpm test auth.service auth.controller -- --testPathPattern=identidad`
Expected: PASS. Confirmar también que el resto de la suite de `identidad`
sigue verde (algo pudo depender del viejo `register` devolviendo sesión):

Run: `cd backend && pnpm test -- --testPathPattern=identidad`
Expected: PASS en todo el proyecto `identidad`.

- [ ] **Step 7: Commit**

```bash
git add backend/apps/identidad/src/auth/auth.service.ts backend/apps/identidad/src/auth/auth.service.spec.ts backend/apps/identidad/src/auth/auth.controller.ts backend/apps/identidad/src/auth/auth.controller.spec.ts
git commit -m "feat(identidad): registro sin sesión hasta confirmar correo, login exige confirmación"
```

---

## Task 4: `confirmEmail` + `resendConfirmation`

**Files:**
- Create: `backend/apps/identidad/src/auth/dto/confirm-email.dto.ts`
- Create: `backend/apps/identidad/src/auth/dto/resend-confirmation.dto.ts`
- Modify: `backend/apps/identidad/src/auth/auth.service.ts`
- Modify: `backend/apps/identidad/src/auth/auth.service.spec.ts`
- Modify: `backend/apps/identidad/src/auth/auth.controller.ts`
- Modify: `backend/apps/identidad/src/auth/auth.controller.spec.ts`

**Interfaces:**
- Consumes: columnas de Task 1, `hashResetToken` (renombrado aquí a
  `hashToken`, mismo cuerpo).
- Produces: `AuthService.confirmEmail(token: string): Promise<void>`,
  `AuthService.resendConfirmation(email: string): Promise<void>`,
  `POST /auth/confirm-email` (body `{ token }`, `@HttpCode(204)`, sin guard),
  `POST /auth/resend-confirmation` (body `{ email }`, mismo
  `@Throttle({ default: { limit: 5, ttl: 60_000 } })` que `forgot-password`).

- [ ] **Step 1: Escribir los DTOs**

```typescript
// backend/apps/identidad/src/auth/dto/confirm-email.dto.ts
import { IsString, MaxLength } from 'class-validator';

export class ConfirmEmailDto {
  /// El token de un solo uso que llegó por correo (ver AuthService.register).
  @IsString()
  @MaxLength(128)
  token: string;
}
```

```typescript
// backend/apps/identidad/src/auth/dto/resend-confirmation.dto.ts
import { IsEmail, MaxLength } from 'class-validator';
import { NormalizeEmail } from '@comun';

export class ResendConfirmationDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(120)
  @NormalizeEmail()
  email: string;
}
```

- [ ] **Step 2: Escribir los tests que fallan, en `auth.service.spec.ts`**

Agregar al final del archivo (después de `describe('AuthService.resetPassword', ...)`):

```typescript
describe('AuthService.confirmEmail', () => {
  it('con un token que no corresponde a ninguna cuenta, rechaza', async () => {
    const auth = service({ findFirst: () => Promise.resolve(null) });

    await expect(auth.confirmEmail('token-cualquiera')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con el token ya vencido, rechaza', async () => {
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            emailConfirmationExpiresAt: new Date(Date.now() - 1000),
          }),
        ),
    });

    await expect(auth.confirmEmail('token-cualquiera')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con un token vigente, marca emailConfirmedAt y limpia el token', async () => {
    let updateData: Record<string, unknown> | undefined;
    const auth = service({
      findFirst: () =>
        Promise.resolve(
          participantRow({
            emailConfirmationExpiresAt: new Date(Date.now() + 60_000),
            emailConfirmedAt: null,
          }),
        ),
      update: ({ data }: { data: Record<string, unknown> }) => {
        updateData = data;
        return Promise.resolve(participantRow());
      },
    });

    await auth.confirmEmail('token-cualquiera');

    expect(updateData?.emailConfirmedAt).toBeInstanceOf(Date);
    expect(updateData?.emailConfirmationTokenHash).toBeNull();
    expect(updateData?.emailConfirmationExpiresAt).toBeNull();
  });
});

describe('AuthService.resendConfirmation', () => {
  it('sin ninguna cuenta con ese correo, responde el mensaje genérico sin mandar correo', async () => {
    const sendEmailConfirmation = jest.fn();
    const auth = service(
      { findFirst: () => Promise.resolve(null) },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await expect(
      auth.resendConfirmation('nadie@correo.com'),
    ).resolves.toBeUndefined();
    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });

  it('con la cuenta ya confirmada, responde igual sin mandar correo', async () => {
    const sendEmailConfirmation = jest.fn();
    const auth = service(
      {
        findFirst: () =>
          Promise.resolve(participantRow({ emailConfirmedAt: new Date() })),
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await auth.resendConfirmation('ana@correo.com');

    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });

  it('con una cuenta real sin confirmar, guarda un token nuevo y reenvía', async () => {
    const sendEmailConfirmation = jest.fn().mockResolvedValue(true);
    let updateData: Record<string, unknown> | undefined;
    const auth = service(
      {
        findFirst: () =>
          Promise.resolve(participantRow({ emailConfirmedAt: null })),
        update: ({ data }: { data: Record<string, unknown> }) => {
          updateData = data;
          return Promise.resolve(participantRow());
        },
      },
      jwtFake(),
      fakeMail({ sendEmailConfirmation }),
    );

    await auth.resendConfirmation('ana@correo.com');

    expect(updateData?.emailConfirmationTokenHash).toEqual(expect.any(String));
    expect(updateData?.emailConfirmationExpiresAt).toBeInstanceOf(Date);
    expect(sendEmailConfirmation).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Correr los tests y verificar que fallan**

Run: `cd backend && pnpm test auth.service -- --testPathPattern=identidad`
Expected: FAIL — `auth.confirmEmail is not a function`,
`auth.resendConfirmation is not a function`.

- [ ] **Step 4: Implementar en `auth.service.ts`**

Renombrar `hashResetToken` → `hashToken` (misma implementación, nombre
genérico porque ahora sirve para dos tipos de token) y actualizar sus dos
llamadas existentes (`forgotPassword`, `resetPassword`) más las dos nuevas
de `register`/las de abajo:

```typescript
/// El token viaja en claro solo por correo; en la base se guarda este hash
/// (SHA-256 alcanza: a diferencia de una contraseña, son 32 bytes al azar,
/// no algo que un diccionario pueda adivinar, así que no hace falta bcrypt).
/// Genérico a propósito: lo usan tanto el token de recuperación de clave
/// como el de confirmación de correo.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

Actualizar también el `EMAIL_NOT_CONFIRMED`/`RESET_LINK_INVALID`: agregar,
junto a `RESET_LINK_INVALID` (línea ~32):

```typescript
/// Mismo mensaje genérico que RESET_LINK_INVALID, mismo motivo: no hace
/// falta que quien lo intenta sepa si el token no existe, ya se usó, o venció.
const CONFIRMATION_LINK_INVALID = 'El enlace no es válido o ya venció.';
```

Agregar los dos métodos nuevos, después de `resetPassword`:

```typescript
  /// Mismo principio que resetPassword: un solo mensaje para token
  /// inexistente, vencido o ya usado.
  async confirmEmail(token: string): Promise<void> {
    const participant = await this.prisma.participant.findFirst({
      where: { emailConfirmationTokenHash: hashToken(token) },
      select: { id: true, emailConfirmationExpiresAt: true },
    });

    if (
      !participant ||
      !participant.emailConfirmationExpiresAt ||
      participant.emailConfirmationExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(CONFIRMATION_LINK_INVALID);
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: {
        emailConfirmedAt: new Date(),
        emailConfirmationTokenHash: null,
        emailConfirmationExpiresAt: null,
      },
    });
  }

  /// Responde siempre lo mismo exista o no la cuenta, o ya esté confirmada
  /// (mismo principio que forgotPassword, issue #256): de lo contrario este
  /// formulario serviría para averiguar qué correos están registrados, o
  /// cuáles ya confirmaron.
  async resendConfirmation(email: string): Promise<void> {
    const participant = await this.prisma.participant.findFirst({
      where: {
        OR: [{ emailHash: hashEmail(email, this.emailPepper) }, { email }],
      },
      select: { id: true, nombre: true, emailConfirmedAt: true },
    });

    if (!participant || participant.emailConfirmedAt) {
      return;
    }

    const token = randomBytes(RESET_TOKEN_BYTES).toString('base64url');

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: {
        emailConfirmationTokenHash: hashToken(token),
        emailConfirmationExpiresAt: new Date(
          Date.now() + EMAIL_CONFIRMATION_TTL_MS,
        ),
      },
    });

    const name = decryptOptional(participant.nombre, this.piiKey) ?? '';
    const link = `${this.frontendOrigin}/confirmar-correo?token=${token}`;
    await this.mail.sendEmailConfirmation(email, name, link);
  }
```

Actualizar las tres llamadas existentes a `hashResetToken` para que digan
`hashToken` en vez de `hashResetToken`: una en `forgotPassword`, una en
`resetPassword`, y la que Task 3 agregó dentro de `register`
(`emailConfirmationTokenHash: hashResetToken(confirmationToken)` pasa a
`hashToken(confirmationToken)`).

- [ ] **Step 5: Agregar los endpoints al controller**

En `backend/apps/identidad/src/auth/auth.controller.ts`, agregar a los
imports existentes (junto a `import { ForgotPasswordDto } from
'./dto/forgot-password.dto';`):

```typescript
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
```

Y agregar los dos métodos, junto a `forgotPassword`/`resetPassword`:

```typescript
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(204)
  @Post('confirm-email')
  async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<void> {
    await this.auth.confirmEmail(dto.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(204)
  @Post('resend-confirmation')
  async resendConfirmation(@Body() dto: ResendConfirmationDto): Promise<void> {
    await this.auth.resendConfirmation(dto.email);
  }
```

- [ ] **Step 6: Tests del controller**

Agregar a `auth.controller.spec.ts`:

```typescript
describe('AuthController.confirmEmail', () => {
  it('delega en el servicio con el token del dto', async () => {
    let receivedToken: string | undefined;
    const service = {
      confirmEmail: (token: string) => {
        receivedToken = token;
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.confirmEmail({ token: 'un-token' });

    expect(receivedToken).toBe('un-token');
    expect(result).toBeUndefined();
  });
});

describe('AuthController.resendConfirmation', () => {
  it('delega en el servicio con el correo del dto', async () => {
    let receivedEmail: string | undefined;
    const service = {
      resendConfirmation: (email: string) => {
        receivedEmail = email;
        return Promise.resolve(undefined);
      },
    } as unknown as AuthService;

    const controller = new AuthController(service);
    const result = await controller.resendConfirmation({
      email: 'ana@correo.com',
    });

    expect(receivedEmail).toBe('ana@correo.com');
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 7: Correr los tests y verificar que pasan**

Run: `cd backend && pnpm test -- --testPathPattern=identidad`
Expected: PASS en toda la suite de `identidad`.

- [ ] **Step 8: Typecheck**

Run: `cd backend && pnpm exec tsc --noEmit -p apps/identidad/tsconfig.app.json`
Expected: sin errores.

- [ ] **Step 9: Commit**

```bash
git add backend/apps/identidad/src/auth/
git commit -m "feat(identidad): confirmar correo y reenviar confirmación"
```

---

## Task 5: Frontend — `api.ts` (tipo de retorno de `register`, `confirmEmail`, `resendConfirmation`) + `AuthContext`

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/api.test.ts`
- Modify: `frontend/src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `POST /auth/register` ahora responde `{ email: string }` (Task
  3), `POST /auth/confirm-email` y `POST /auth/resend-confirmation` (Task 4).
- Produces: `register(credentials: Credentials): Promise<{ email: string }>`
  (cambia de `Promise<Session>`), `confirmEmail(token: string): Promise<null>`,
  `resendConfirmation(email: string): Promise<null>`. `AuthContext.register`
  cambia su tipo de retorno a `Promise<{ email: string }>` (ya no
  `Promise<Participant>`), y ya no llama `api.setToken`/`setParticipant`.

- [ ] **Step 1: Escribir los tests que fallan**

En `frontend/src/lib/api.test.ts`, localizar el `describe` que prueba
`register` (busca `'register'` en el archivo) y reemplazar su test por:

```typescript
it('register ya no arma sesión: devuelve solo el correo', async () => {
  mockFetch({ json: () => Promise.resolve({ email: 'ana@correo.com' }) })

  const result = await register({
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@correo.com',
    cedula: '1710034065',
    password: 'ClaveSegura123!',
  })

  expect(result).toEqual({ email: 'ana@correo.com' })
})
```

(Revisar el `import` al inicio del archivo: `register` ya debería estar
importado desde `../lib/api` junto a los demás; si el test viejo usaba
`Session`, ese tipo ya no aplica acá.)

Agregar, en cualquier lugar del archivo junto a los tests de
`forgotPassword`/`resetPassword`:

```typescript
it('confirmEmail manda el token, sin sesión (auth: false)', async () => {
  const fetchMock = mockFetch({ json: () => Promise.resolve(null) })

  await confirmEmail('un-token')

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toContain('/auth/confirm-email')
  expect(JSON.parse(init.body as string)).toEqual({ token: 'un-token' })
})

it('resendConfirmation manda el correo, sin sesión (auth: false)', async () => {
  const fetchMock = mockFetch({ json: () => Promise.resolve(null) })

  await resendConfirmation('ana@correo.com')

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toContain('/auth/resend-confirmation')
  expect(JSON.parse(init.body as string)).toEqual({ email: 'ana@correo.com' })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `cd frontend && npx vitest run src/lib/api.test.ts`
Expected: FAIL — `confirmEmail`/`resendConfirmation` no exportados; el test
de `register` falla porque hoy devuelve una `Session` completa.

- [ ] **Step 3: Implementar en `api.ts`**

Modificar la firma de `register` (línea ~236):

```typescript
export function register(credentials: Credentials): Promise<{ email: string }> {
  return request<{ email: string }>('/auth/register', {
    method: 'POST',
    body: credentials,
    auth: false,
  })
}
```

Agregar, junto a `resetPassword`:

```typescript
export function confirmEmail(token: string): Promise<null> {
  return request<null>('/auth/confirm-email', {
    method: 'POST',
    body: { token },
    auth: false,
  })
}

// Misma discreción que forgotPassword: la respuesta no distingue cuenta
// inexistente de ya confirmada.
export function resendConfirmation(email: string): Promise<null> {
  return request<null>('/auth/resend-confirmation', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `cd frontend && npx vitest run src/lib/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Actualizar `AuthContext.tsx`**

Cambiar el tipo `register` en `AuthValue` (línea ~20):

```typescript
  register: (credentials: Credentials) => Promise<{ email: string }>
```

Reemplazar la implementación de `register` (línea ~111-116):

```typescript
  // Ya no arma sesión: el registro exige confirmar el correo antes de poder
  // entrar. Quien llama (Registro.tsx) decide qué mostrar con el correo que
  // devuelve, no este contexto.
  const register = useCallback(async (credentials: Credentials) => {
    return api.register(credentials)
  }, [])
```

- [ ] **Step 6: Correr la suite de `AuthContext` si existe, y typecheck**

Run: `cd frontend && npx vitest run src/context/AuthContext.test.tsx 2>/dev/null; npx tsc --noEmit`
Expected: sin errores. Si `AuthContext.test.tsx` no existe todavía, no hace
falta crearlo en este task — el comportamiento se cubre indirectamente por
los tests de `Registro.test.tsx` en la Task 6. Si sí existe y algún test
asume que `register` autentica, ajustarlo para reflejar el nuevo
comportamiento (no llama `setToken`, no cambia `isAuthenticated`).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts frontend/src/context/AuthContext.tsx
git commit -m "feat(frontend): register ya no arma sesión, agregar confirmEmail/resendConfirmation"
```

---

## Task 6: Frontend — `Registro.tsx` navega a "revisa tu correo" + página nueva

**Files:**
- Modify: `frontend/src/pages/Registro.tsx`
- Create: `frontend/src/pages/Registro.test.tsx` (no existe todavía)
- Create: `frontend/src/pages/RevisaTuCorreo.tsx`
- Create: `frontend/src/pages/RevisaTuCorreo.test.tsx`
- Modify: `frontend/src/App.tsx` (nueva ruta `/revisa-tu-correo`)

**Interfaces:**
- Consumes: `register(credentials): Promise<{ email: string }>` (Task 5),
  `resendConfirmation(email: string): Promise<null>` (Task 5).
- Produces: ruta `/revisa-tu-correo` (recibe el correo vía `state` de
  `navigate`, con fallback si alguien entra directo sin pasar por el
  registro).

- [ ] **Step 1: Escribir el test que falla, para `RevisaTuCorreo`**

```typescript
// frontend/src/pages/RevisaTuCorreo.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RevisaTuCorreo from './RevisaTuCorreo'
import * as api from '../lib/api'

function renderWithState(email: string | undefined) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/revisa-tu-correo', state: email ? { email } : undefined }]}
    >
      <Routes>
        <Route path="/revisa-tu-correo" element={<RevisaTuCorreo />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RevisaTuCorreo', () => {
  it('muestra el correo al que se mandó la confirmación', () => {
    renderWithState('ana@correo.com')
    expect(screen.getByText(/ana@correo\.com/)).toBeDefined()
  })

  it('sin correo en el estado (entrada directa), muestra un mensaje genérico sin reventar', () => {
    renderWithState(undefined)
    expect(screen.getByText(/revisa tu correo/i)).toBeDefined()
  })

  it('el botón de reenviar llama a resendConfirmation con el correo', async () => {
    const resendConfirmation = vi.spyOn(api, 'resendConfirmation').mockResolvedValue(null)
    renderWithState('ana@correo.com')

    fireEvent.click(screen.getByRole('button', { name: /reenviar/i }))

    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith('ana@correo.com'))
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd frontend && npx vitest run src/pages/RevisaTuCorreo.test.tsx`
Expected: FAIL — `Cannot find module './RevisaTuCorreo'`

- [ ] **Step 3: Implementar `RevisaTuCorreo.tsx`**

```typescript
// frontend/src/pages/RevisaTuCorreo.tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { ApiError, resendConfirmation } from '../lib/api'

interface LocationState {
  email?: string
}

function RevisaTuCorreo() {
  const location = useLocation()
  const email = (location.state as LocationState | null)?.email

  const [sending, setSending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    if (!email) return
    setSending(true)
    setError('')

    try {
      await resendConfirmation(email)
      setResent(true)
    } catch (resendError) {
      setError(
        resendError instanceof ApiError
          ? resendError.message
          : 'No se pudo conectar con el servidor.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      folio="REGISTRO"
      titulo="Revisa tu correo"
      subtitulo={
        email
          ? `Te mandamos un enlace de confirmación a ${email}.`
          : 'Te mandamos un enlace de confirmación a tu correo.'
      }
      pie={
        <p className="mt-6 text-base text-body">
          <Link to="/login" className="font-medium text-link underline">
            Ya confirmé, ir a iniciar sesión
          </Link>
        </p>
      }
    >
      <p className="mt-6 text-base text-body">
        Haz clic en el enlace del correo para poder iniciar sesión. El enlace
        vence en 24 horas.
      </p>

      {email && (
        <div className="mt-6">
          {resent ? (
            <p className="text-sm text-success-ink">Te lo volvimos a mandar.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="text-sm font-medium text-link underline disabled:opacity-60"
            >
              {sending ? 'Enviando…' : '¿No te llegó? Reenviar'}
            </button>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </AuthLayout>
  )
}

export default RevisaTuCorreo
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd frontend && npx vitest run src/pages/RevisaTuCorreo.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Escribir el test de `Registro.tsx` (no existe todavía — crear el archivo)**

`Registro.tsx` no tiene ningún test hoy. Mismo patrón de mocks que
`frontend/src/pages/Login.test.tsx` (mockea `useAuth` de
`../context/AuthContext` con `vi.mock` + `vi.hoisted`), más un mock parcial
de `react-router` para espiar `useNavigate` sin perder `Link`/`Navigate`
reales:

```typescript
// frontend/src/pages/Registro.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Registration from './Registro'

const { useAuthMock, navigateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigateMock }
})

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
  fireEvent.change(screen.getByLabelText('Cédula'), { target: { value: '1710034065' } })
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@correo.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'ClaveSegura123!' },
  })
  fireEvent.click(screen.getByLabelText(/acepto/i))
}

describe('Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tras registrarse, navega a /revisa-tu-correo con el correo en el state', async () => {
    const register = vi.fn().mockResolvedValue({ email: 'ana@correo.com' })
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register,
    })

    render(
      <BrowserRouter>
        <Registration />
      </BrowserRouter>,
    )

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/revisa-tu-correo', {
        state: { email: 'ana@correo.com' },
      }),
    )
  })

  it('si register falla, muestra el error y no navega', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Ya existe una cuenta con esos datos.'))
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      register,
    })

    render(
      <BrowserRouter>
        <Registration />
      </BrowserRouter>,
    )

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(screen.getByText('Ya existe una cuenta con esos datos.')).toBeDefined(),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Correr el test y verificar que falla**

Run: `cd frontend && npx vitest run src/pages/Registro.test.tsx`
Expected: FAIL — hoy `Registro.tsx` llama `navigate("/dashboard")` tras
`register(...)`, no `navigate("/revisa-tu-correo", { state: ... })`.

- [ ] **Step 7: Actualizar `Registro.tsx`**

Cambiar el `handleSubmit` (línea ~181-188):

```typescript
    try {
      const { email: confirmedEmail } = await register({
        nombre: name,
        apellido: lastName,
        email,
        cedula: normalizedEcuadorianId,
        password,
      });
      navigate("/revisa-tu-correo", { state: { email: confirmedEmail } });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
```

- [ ] **Step 8: Agregar la ruta nueva en `App.tsx`**

Agregar el import junto a los demás de `pages/`:

```typescript
import RevisaTuCorreo from './pages/RevisaTuCorreo'
```

Y la ruta, junto a `/registro` (pública, sin `RequireAuth`):

```typescript
          <Route path="/revisa-tu-correo" element={<RevisaTuCorreo />} />
```

- [ ] **Step 9: Correr los tests y verificar que pasan**

Run: `cd frontend && npx vitest run src/pages/Registro.test.tsx src/pages/RevisaTuCorreo.test.tsx`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/Registro.tsx frontend/src/pages/Registro.test.tsx frontend/src/pages/RevisaTuCorreo.tsx frontend/src/pages/RevisaTuCorreo.test.tsx frontend/src/App.tsx
git commit -m "feat(frontend): Registro navega a revisa-tu-correo en vez de entrar directo"
```

---

## Task 7: Frontend — página `ConfirmarCorreo.tsx`

**Files:**
- Create: `frontend/src/pages/ConfirmarCorreo.tsx`
- Create: `frontend/src/pages/ConfirmarCorreo.test.tsx`
- Modify: `frontend/src/App.tsx` (nueva ruta `/confirmar-correo`)

**Interfaces:**
- Consumes: `confirmEmail(token: string): Promise<null>`,
  `resendConfirmation(email: string): Promise<null>` (Task 5).

- [ ] **Step 1: Escribir el test que falla**

```typescript
// frontend/src/pages/ConfirmarCorreo.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ConfirmarCorreo from './ConfirmarCorreo'
import * as api from '../lib/api'

function renderWithToken(token: string | null) {
  const path = token ? `/confirmar-correo?token=${token}` : '/confirmar-correo'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfirmarCorreo', () => {
  it('sin token en la URL, muestra que el enlace no es válido', () => {
    renderWithToken(null)
    expect(screen.getByText(/enlace no es válido/i)).toBeDefined()
  })

  it('con un token válido, confirma y muestra éxito', async () => {
    vi.spyOn(api, 'confirmEmail').mockResolvedValue(null)
    renderWithToken('un-token')

    await waitFor(() => expect(screen.getByText(/confirmamos tu correo/i)).toBeDefined())
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeDefined()
  })

  it('con un token vencido o inválido, muestra el error del servidor', async () => {
    vi.spyOn(api, 'confirmEmail').mockRejectedValue(
      new api.ApiError('El enlace no es válido o ya venció.', 401),
    )
    renderWithToken('un-token-vencido')

    await waitFor(() =>
      expect(screen.getByText('El enlace no es válido o ya venció.')).toBeDefined(),
    )
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd frontend && npx vitest run src/pages/ConfirmarCorreo.test.tsx`
Expected: FAIL — `Cannot find module './ConfirmarCorreo'`

- [ ] **Step 3: Implementar `ConfirmarCorreo.tsx`**

Mismo patrón que `frontend/src/pages/Verificar.tsx` (confirma
automáticamente al montar, sin formulario):

```typescript
// frontend/src/pages/ConfirmarCorreo.tsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { ApiError, confirmEmail } from '../lib/api'

type Estado = 'confirmando' | 'listo' | 'error'

function ConfirmarCorreo() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState<Estado>('confirmando')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    confirmEmail(token)
      .then(() => {
        if (!cancelled) setEstado('listo')
      })
      .catch((confirmError) => {
        if (cancelled) return
        setError(
          confirmError instanceof ApiError
            ? confirmError.message
            : 'No se pudo conectar con el servidor.',
        )
        setEstado('error')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Este enlace no es válido"
        subtitulo="Puede que esté incompleto."
        pie={null}
      >
        <p className="mt-6 text-base text-body">
          <Link to="/revisa-tu-correo" className="font-medium text-link underline">
            Volver
          </Link>
        </p>
      </AuthLayout>
    )
  }

  if (estado === 'confirmando') {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Confirmando…"
        subtitulo=""
        pie={null}
      >
        <p className="mt-6 text-base text-body">Un momento.</p>
      </AuthLayout>
    )
  }

  if (estado === 'listo') {
    return (
      <AuthLayout
        folio="CONFIRMAR CORREO"
        titulo="Listo"
        subtitulo="Confirmamos tu correo."
        pie={null}
      >
        <p className="mt-6 text-base text-body">
          <Link to="/login" className="font-medium text-link underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      folio="CONFIRMAR CORREO"
      titulo="No pudimos confirmar tu correo"
      subtitulo=""
      pie={null}
    >
      <p role="alert" className="mt-6 text-sm text-danger">
        {error}
      </p>
      <p className="mt-4 text-base text-body">
        <Link to="/revisa-tu-correo" className="font-medium text-link underline">
          Pedir un enlace nuevo
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ConfirmarCorreo
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd frontend && npx vitest run src/pages/ConfirmarCorreo.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Agregar la ruta en `App.tsx`**

```typescript
import ConfirmarCorreo from './pages/ConfirmarCorreo'
```

```typescript
          <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
```

(Pública, sin `RequireAuth` — igual que `/restablecer-password`.)

- [ ] **Step 6: Correr toda la suite del frontend**

Run: `cd frontend && npx vitest run`
Expected: todos los archivos en verde.

- [ ] **Step 7: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/ConfirmarCorreo.tsx frontend/src/pages/ConfirmarCorreo.test.tsx frontend/src/App.tsx
git commit -m "feat(frontend): página de confirmación de correo"
```

---

## Task 8: Verificación manual + limpieza de comentarios obsoletos

**Files:**
- Modify: `.env.example`, `backend/.env.example` (corregir el comentario
  desactualizado de `RESEND_API_KEY`)

**Interfaces:** ninguna nueva.

- [ ] **Step 1: Corregir el comentario obsoleto**

En `.env.example` y `backend/.env.example`, el comentario sobre
`RESEND_API_KEY` dice "Correo de verificación de cuenta y entrega del
certificado" — desactualizado desde que se descartó la verificación (ahora
vuelve a existir, así que en realidad el comentario vuelve a ser correcto,
pero conviene sumarle recuperación de clave, que tampoco mencionaba):

```bash
# Correo de confirmación de cuenta, recuperación de clave, y entrega del
# certificado (Resend). API key en resend.com/api-keys. Dominio verificado
# en resend.com/domains.
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
```

- [ ] **Step 2: Levantar backend y frontend, registrar una cuenta de prueba**

Confirmar que `identidad` corre con las migraciones de Task 1 aplicadas.
Ir a `/registro`, completar el formulario con un correo real al que se tenga
acceso (o revisar el log de Resend / la bandeja de un correo de prueba).
Confirmar que:
1. Tras enviar el formulario, la pantalla cambia a "Revisa tu correo" con el
   correo correcto.
2. Intentar iniciar sesión con esa cuenta antes de confirmar: el login
   rechaza con el mensaje "Confirma tu correo antes de iniciar sesión...".
3. El correo llega (o se ve en el log de Resend) con la plantilla nueva
   (encabezado, pie de página, link de confirmación).
4. Al hacer clic en el link (o pegar la URL con el token en el navegador),
   la página `/confirmar-correo` muestra éxito.
5. Iniciar sesión de nuevo: ahora entra normalmente.
6. Repetir el registro con otro correo y probar el botón "Reenviar" en la
   pantalla de "Revisa tu correo": confirma que llega un segundo correo con
   un token distinto (el primer link deja de servir, si se llega a probar).

- [ ] **Step 3: Confirmar visualmente la plantilla en los tres correos**

Revisar (por correo real o por el payload que loguea Resend en modo
desarrollo) que el correo de recuperación de clave y el de certificado
también muestran la plantilla nueva (encabezado "SAFE-Web", pie de página),
no solo el de confirmación.

- [ ] **Step 4: Confirmar que una cuenta ya existente (creada antes de este cambio) sigue entrando sin pedir confirmación**

Si hay una cuenta de prueba anterior a este cambio en la base de desarrollo,
iniciar sesión con ella y confirmar que entra sin ningún bloqueo (la
migración de Task 1 la dejó con `emailConfirmedAt` no nulo).
