# Saludo personalizado en la narración — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El botón "Escuchar el contexto" dice primero el nombre real del
participante ("Hola, {nombre}. Esto es lo que te está pasando:"), sintetizado
en el momento, y luego sigue con el clip de contexto estático que ya existe.

**Architecture:** Un endpoint nuevo `GET /narracion/saludo` en el backend
`identidad` busca al participante autenticado, desencripta su nombre (PII ya
cifrada en la base), sintetiza el saludo con Cartesia (con una caché en
memoria del proceso, sin tocar disco), y devuelve el MP3 como bytes. El
frontend pide ese audio al presionar el botón, lo encadena con el audio de
contexto ya existente usando dos elementos `<audio>`, y maneja el estado de
carga y el caso de que el saludo falle.

**Tech Stack:** NestJS (backend `identidad`), Prisma, Cartesia TTS API (HTTP
directo con `fetch` global de Node, sin SDK), React 19 + TypeScript
(frontend), Vitest (frontend), Jest (backend).

**Spec:** `docs/superpowers/specs/2026-09-24-saludo-personalizado-narracion-design.md`

## Global Constraints

- El primer nombre se extrae con la misma lógica que `firstName()` en
  `frontend/src/context/AuthContext.tsx`: recortar espacios y tomar el primer
  token separado por espacios.
- Si el nombre desencriptado es `null`/vacío, el saludo es "Hola. Esto es lo
  que te está pasando:" (sin coma ni nombre) — el endpoint nunca falla por
  falta de nombre.
- La caché del saludo vive en un `Map<string, Buffer>` en memoria del proceso
  Node de `identidad`. Nunca se escribe a disco ni a la base de datos.
- Voz y modelo de Cartesia: mismo `voice_id` (`3597a26f-80ef-4bd5-8101-9699bc764917`)
  y `model_id` (`sonic-2`) que ya usa `frontend/scripts/narracion.py`.
- La clave de Cartesia se **copia** (no se mueve) a `backend/.env` como
  `CARTESIA_API_KEY`: `frontend/scripts/narracion.py` sigue necesitando su
  copia en `frontend/.env` para poder regenerar los 53 clips de contexto en
  el futuro. Ambos archivos ya están en `.gitignore`.
- Los 53 clips de contexto de `src/data/narracion.ts` y `public/narracion/`
  no cambian en este plan.
- El endpoint no acepta ningún parámetro de texto: el nombre sale siempre del
  participante autenticado (`@CurrentParticipant()`), nunca de query string ni
  body, para que nadie pueda usarlo para sintetizar texto arbitrario.

---

## Task 1: Backend — `NarracionService` con caché en memoria y llamada a Cartesia

**Files:**
- Create: `backend/apps/identidad/src/narracion/narracion.service.ts`
- Create: `backend/apps/identidad/src/narracion/narracion.service.spec.ts`

**Interfaces:**
- Produces: `NarracionService.saludo(participant: JwtPayload): Promise<Buffer>`
  — clase `@Injectable()`, constructor `(prisma: PrismaService, config: ConfigService)`.

- [ ] **Step 1: Escribir el test que falla — nombre válido, caché vacía, llama a Cartesia**

```typescript
// backend/apps/identidad/src/narracion/narracion.service.spec.ts
import type { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@comun';
import { NarracionService } from './narracion.service';
import type { PrismaService } from '../prisma/prisma.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

function fakeConfig(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key === 'PII_ENCRYPTION_KEY') return 'clave-de-prueba';
      if (key === 'CARTESIA_API_KEY') return 'sk_car_prueba';
      throw new Error(`config no esperada: ${key}`);
    },
  } as unknown as ConfigService;
}

function fakePrisma(nombre: string | null): PrismaService {
  return {
    participant: {
      findUnique: () => Promise.resolve(nombre === undefined ? null : { nombre }),
    },
  } as unknown as PrismaService;
}

describe('NarracionService.saludo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sintetiza "Hola, {primerNombre}. Esto es lo que te está pasando:" con Cartesia', async () => {
    const audio = Buffer.from('mp3-falso');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(audio.buffer),
    });
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

    const service = new NarracionService(fakePrisma('Sebastián Parra'), fakeConfig());
    const result = await service.saludo(PARTICIPANT);

    expect(result).toEqual(audio);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.cartesia.ai/tts/bytes');
    const body = JSON.parse(init.body as string) as { transcript: string };
    expect(body.transcript).toBe(
      'Hola, Sebastián. Esto es lo que te está pasando:',
    );
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test narracion.service -- --testPathPattern=identidad`
Expected: FAIL — `Cannot find module './narracion.service'`

- [ ] **Step 3: Implementación mínima**

```typescript
// backend/apps/identidad/src/narracion/narracion.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@comun';
import { decryptOptional } from '../pii/pii';
import { PrismaService } from '../prisma/prisma.service';

const VOZ_ID = '3597a26f-80ef-4bd5-8101-9699bc764917';
const MODELO = 'sonic-2';

/// Igual que `firstName()` en frontend/src/context/AuthContext.tsx: recorta
/// y toma el primer token. Vive duplicada a propósito — un nombre es un
/// string, no vale la pena una dependencia compartida frontend/backend por
/// una línea, y así cada lado se puede tocar sin coordinar un release.
function primerNombre(nombreCompleto: string | null): string {
  return nombreCompleto?.trim().split(/\s+/)[0] ?? '';
}

function textoSaludo(nombre: string): string {
  return nombre
    ? `Hola, ${nombre}. Esto es lo que te está pasando:`
    : 'Hola. Esto es lo que te está pasando:';
}

@Injectable()
export class NarracionService {
  private readonly piiKey: string;
  private readonly cartesiaKey: string;
  // En memoria, no en disco (ver certificados.service.ts: un archivo
  // generado a partir de datos personales no se persiste a propósito).
  private readonly cache = new Map<string, Buffer>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.piiKey = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    this.cartesiaKey = config.getOrThrow<string>('CARTESIA_API_KEY');
  }

  async saludo(participant: JwtPayload): Promise<Buffer> {
    const person = await this.prisma.participant.findUnique({
      where: { id: participant.sub },
      select: { nombre: true },
    });

    const nombre = primerNombre(decryptOptional(person?.nombre ?? null, this.piiKey));

    const cached = this.cache.get(nombre);
    if (cached) return cached;

    const audio = await this.sintetizar(textoSaludo(nombre));
    this.cache.set(nombre, audio);
    return audio;
  }

  private async sintetizar(texto: string): Promise<Buffer> {
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': this.cartesiaKey,
        'Cartesia-Version': '2024-11-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: MODELO,
        transcript: texto,
        voice: { mode: 'id', id: VOZ_ID },
        output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
        language: 'es',
      }),
    });

    if (!response.ok) {
      throw new Error(`Cartesia respondió ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test narracion.service -- --testPathPattern=identidad`
Expected: PASS

- [ ] **Step 5: Escribir el test de la caché en memoria (segunda llamada, mismo nombre, no vuelve a llamar a Cartesia)**

```typescript
// agregar a narracion.service.spec.ts, dentro del mismo describe
it('cachea en memoria: la segunda llamada con el mismo nombre no vuelve a llamar a Cartesia', async () => {
  const audio = Buffer.from('mp3-falso');
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(audio.buffer),
  });
  jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

  const service = new NarracionService(fakePrisma('Ana López'), fakeConfig());
  await service.saludo(PARTICIPANT);
  await service.saludo(PARTICIPANT);

  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('sin nombre (dato anonimizado), usa el saludo genérico y no revienta', async () => {
  const audio = Buffer.from('mp3-falso');
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(audio.buffer),
  });
  jest.spyOn(global, 'fetch').mockImplementation(fetchMock as never);

  const service = new NarracionService(fakePrisma(null), fakeConfig());
  await service.saludo(PARTICIPANT);

  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  const body = JSON.parse(init.body as string) as { transcript: string };
  expect(body.transcript).toBe('Hola. Esto es lo que te está pasando:');
});
```

- [ ] **Step 6: Correr los tests y verificar que todos pasan**

Run: `pnpm test narracion.service -- --testPathPattern=identidad`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/apps/identidad/src/narracion/narracion.service.ts backend/apps/identidad/src/narracion/narracion.service.spec.ts
git commit -m "feat(identidad): sintetizar el saludo personalizado con caché en memoria"
```

---

## Task 2: Backend — `NarracionController` + `NarracionModule`, montado en `AppModule`

**Files:**
- Create: `backend/apps/identidad/src/narracion/narracion.controller.ts`
- Create: `backend/apps/identidad/src/narracion/narracion.controller.spec.ts`
- Create: `backend/apps/identidad/src/narracion/narracion.module.ts`
- Modify: `backend/apps/identidad/src/app.module.ts` (registrar `NarracionModule`)

**Interfaces:**
- Consumes: `NarracionService.saludo(participant: JwtPayload): Promise<Buffer>` (Task 1)
- Produces: `GET /narracion/saludo` — 200, `Content-Type: audio/mpeg`, cuerpo = bytes del MP3.

- [ ] **Step 1: Escribir el test que falla — el controller delega en el servicio y responde con el `Content-Type` correcto**

```typescript
// backend/apps/identidad/src/narracion/narracion.controller.spec.ts
import type { Response } from 'express';
import type { JwtPayload } from '@comun';
import { NarracionController } from './narracion.controller';
import type { NarracionService } from './narracion.service';

const PARTICIPANT: JwtPayload = {
  sub: 'uuid-a',
  seq: 7,
  role: 'PARTICIPANT',
  typ: 'access',
};

/// Misma respuesta de Express falsa que certificados.controller.spec.ts.
function fakeResponse() {
  const calls: { status?: number; headers?: Record<string, string>; body?: unknown } = {};
  const res = {
    status: (code: number) => {
      calls.status = code;
      return res;
    },
    set: (headers: Record<string, string>) => {
      calls.headers = headers;
      return res;
    },
    send: (body: unknown) => {
      calls.body = body;
      return res;
    },
  } as unknown as Response;
  return { res, calls };
}

describe('NarracionController', () => {
  it('saludo delega en el servicio con el participante del token y responde audio/mpeg', async () => {
    const audio = Buffer.from('mp3-falso');
    let received: JwtPayload | undefined;
    const service = {
      saludo: (participant: JwtPayload) => {
        received = participant;
        return Promise.resolve(audio);
      },
    } as unknown as NarracionService;

    const controller = new NarracionController(service);
    const { res, calls } = fakeResponse();
    await controller.saludo(PARTICIPANT, res);

    expect(received).toEqual(PARTICIPANT);
    expect(calls.status).toBe(200);
    expect(calls.headers).toEqual({ 'Content-Type': 'audio/mpeg' });
    expect(calls.body).toBe(audio);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test narracion.controller -- --testPathPattern=identidad`
Expected: FAIL — `Cannot find module './narracion.controller'`

- [ ] **Step 3: Implementación mínima del controller y el módulo**

```typescript
// backend/apps/identidad/src/narracion/narracion.controller.ts
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentParticipant, JwtAuthGuard, ParticipantGuard, type JwtPayload } from '@comun';
import { NarracionService } from './narracion.service';

@Controller('narracion')
export class NarracionController {
  constructor(private readonly narracion: NarracionService) {}

  @UseGuards(JwtAuthGuard, ParticipantGuard)
  @Get('saludo')
  async saludo(@CurrentParticipant() participant: JwtPayload, @Res() res: Response) {
    const audio = await this.narracion.saludo(participant);
    res.status(200).set({ 'Content-Type': 'audio/mpeg' }).send(audio);
  }
}
```

```typescript
// backend/apps/identidad/src/narracion/narracion.module.ts
import { Module } from '@nestjs/common';
import { AuthJwtModule } from '@comun';
import { NarracionController } from './narracion.controller';
import { NarracionService } from './narracion.service';

@Module({
  imports: [AuthJwtModule],
  controllers: [NarracionController],
  providers: [NarracionService],
})
export class NarracionModule {}
```

Modificar `backend/apps/identidad/src/app.module.ts`: agregar el import y
sumarlo al arreglo `imports` del `AppModule`, junto a `CertificatesModule`.

```typescript
import { NarracionModule } from './narracion/narracion.module';
// ...dentro de imports: [..., CertificatesModule, NarracionModule],
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test narracion.controller -- --testPathPattern=identidad`
Expected: PASS

- [ ] **Step 5: Confirmar que el módulo arranca (typecheck + build no rompe)**

Run: `pnpm --filter identidad exec tsc --noEmit` (o `pnpm build` si ese script no existe suelto)
Expected: sin errores

- [ ] **Step 6: Commit**

```bash
git add backend/apps/identidad/src/narracion/narracion.controller.ts backend/apps/identidad/src/narracion/narracion.controller.spec.ts backend/apps/identidad/src/narracion/narracion.module.ts backend/apps/identidad/src/app.module.ts
git commit -m "feat(identidad): exponer GET /narracion/saludo"
```

---

## Task 3: Backend — variable de entorno `CARTESIA_API_KEY`

**Files:**
- Modify: `backend/.env.example`
- Modify: `backend/.env` (archivo real, ya gitignored — no se commitea)

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: `CARTESIA_API_KEY` disponible vía `ConfigService.getOrThrow('CARTESIA_API_KEY')`, que ya consume `NarracionService` (Task 1).

- [ ] **Step 1: Agregar la variable documentada a `.env.example`**

Agregar al final de `backend/.env.example`:

```bash
# Voz del saludo personalizado y de la narración del contexto de cada
# escenario (issue #285). API key en play.cartesia.ai. Solo la usa
# `identidad`; `frontend/scripts/narracion.py` tiene su propia copia en
# frontend/.env para regenerar los clips de contexto.
CARTESIA_API_KEY="sk_car_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

- [ ] **Step 2: Copiar la clave real al `.env` del backend**

Leer `frontend/.env` (ya tiene `CARTESIA_API_KEY=sk_car_CKRgJVUetj5pmE5Aukjn68`
de la generación de los 53 clips de contexto) y agregar la misma línea a
`backend/.env`. No se toca `frontend/.env`: sigue haciendo falta ahí para
`scripts/narracion.py`.

- [ ] **Step 3: Verificar que el backend arranca con la variable presente**

Run: `pnpm start:identidad` (o reiniciar el proceso si ya está corriendo) y
confirmar en el log que no hay un error de `ConfigService.getOrThrow` sobre
`CARTESIA_API_KEY`.
Expected: el servicio arranca sin lanzar la excepción de configuración
faltante.

- [ ] **Step 4: Commit (solo `.env.example`; `.env` nunca se commitea)**

```bash
git add backend/.env.example
git commit -m "docs(identidad): documentar CARTESIA_API_KEY en .env.example"
```

---

## Task 4: Frontend — `api.ts`: generalizar `requestBlob` y agregar `fetchGreetingAudio`

**Files:**
- Modify: `frontend/src/lib/api.ts:203-231` (`requestBlob`), `:403-405` (`downloadCertificatePdf`)
- Modify: `frontend/src/lib/api.test.ts` (tests existentes de `downloadCertificatePdf` deben seguir pasando; se agregan los de `fetchGreetingAudio`)

**Interfaces:**
- Produces: `fetchGreetingAudio(): Promise<Blob>` — `GET /narracion/saludo`, autenticado, sin body.

- [ ] **Step 1: Escribir el test que falla**

```typescript
// agregar a frontend/src/lib/api.test.ts, junto a los tests de downloadCertificatePdf
it('fetchGreetingAudio pide GET /narracion/saludo con el token y devuelve el blob', async () => {
  setToken('t0ken')
  const audio = new Blob(['mp3-falso'])
  const fetchMock = mockFetch({ blob: () => Promise.resolve(audio) })

  const result = await fetchGreetingAudio()

  expect(result).toBe(audio)
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toContain('/narracion/saludo')
  expect(init.method).toBe('GET')
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t0ken')
})
```

(Revisar el `import` al inicio de `api.test.ts`: agregar `fetchGreetingAudio`
junto a los demás imports de `../lib/api` ya listados ahí.)

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — `fetchGreetingAudio is not a function` / `is not exported`

- [ ] **Step 3: Generalizar `requestBlob` y agregar `fetchGreetingAudio`**

En `frontend/src/lib/api.ts`, reemplazar la firma actual de `requestBlob`
(que asume siempre `POST` con body) por una que acepte el método:

```typescript
// Reemplaza la función requestBlob existente (líneas ~203-231)
async function requestBlob(
  path: string,
  options: { method?: string; body?: unknown } = {},
  retried = false,
): Promise<Blob> {
  const { method = 'POST', body } = options
  const token = getToken()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    if (response.status === 401 && !retried && (await refreshSession())) {
      return requestBlob(path, options, true)
    }
    if (response.status === 401) {
      setToken(null)
    }
    throw new ApiError('No se pudo obtener el archivo.', response.status)
  }

  return response.blob()
}
```

Actualizar el único punto de llamada existente, `downloadCertificatePdf`
(cerca de la línea 403), para pasar el body dentro de `options`:

```typescript
export function downloadCertificatePdf(attestation: string): Promise<Blob> {
  return requestBlob('/certificados/pdf', { body: { atestacion: attestation } })
}
```

Agregar la función nueva junto a `downloadCertificatePdf`:

```typescript
/** Sin body: el nombre sale del participante autenticado, nunca de aquí. */
export function fetchGreetingAudio(): Promise<Blob> {
  return requestBlob('/narracion/saludo', { method: 'GET' })
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS, incluyendo los tests preexistentes de `downloadCertificatePdf`
(el mensaje de error genérico cambió de "No se pudo generar el certificado."
a "No se pudo obtener el archivo." — si algún test existente lo comprueba
literal, actualizarlo a la vez, sin dejarlo roto).

- [ ] **Step 5: Correr toda la suite de `api.test.ts` para confirmar que nada más se rompió**

Run: `npx vitest run src/lib/api.test.ts`
Expected: todos los tests del archivo en verde.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts
git commit -m "feat(frontend): agregar fetchGreetingAudio, generalizar requestBlob a GET/POST"
```

---

## Task 5: Frontend — `NarracionContexto.tsx` encadena saludo + contexto

**Files:**
- Modify: `frontend/src/components/ui/NarracionContexto.tsx` (reemplazo completo)
- Modify: `frontend/src/components/ui/NarracionContexto.test.tsx` (se agregan casos; los 3 existentes deben seguir pasando o adaptarse al nuevo comportamiento)

**Interfaces:**
- Consumes: `fetchGreetingAudio(): Promise<Blob>` (Task 4), `NARRATION: Record<string, string>` y `textoNarracion(contexto: Context): string` (ya existentes).
- Produces: mismo componente `NarracionContexto({ contexto: Context })`, mismo texto de botón ("Escuchar el contexto" / "Pausar narración"), con un estado de carga intermedio ("Cargando…") entre el click y el inicio de la reproducción.

- [ ] **Step 1: Actualizar los tests existentes para el nuevo flujo (dos audios encadenados) — esto es RED hasta el Step 3**

Reemplazar el contenido completo de
`frontend/src/components/ui/NarracionContexto.test.tsx`:

```typescript
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NarracionContexto from './NarracionContexto'
import type { Context } from './ContextoEscenario'
import * as api from '../../lib/api'

vi.mock('../../data/narracion', () => ({
  NARRATION: {
    'No juegas a la lotería. Aparece un correo. Tu misión: decide qué haces con esto y por qué.':
      '/narracion/abc123.mp3',
  },
}))

const CONTEXTO_CON_AUDIO: Context = {
  antes: 'No juegas a la lotería.',
  ahora: 'Aparece un correo.',
}

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn()
  HTMLMediaElement.prototype.pause = vi.fn()
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:saludo-fake-url'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('NarracionContexto', () => {
  it('muestra un botón para reproducir la narración del contexto', () => {
    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('al presionar, pide el saludo, lo reproduce, y encadena el audio de contexto al terminar', async () => {
    const saludo = new Blob(['saludo-mp3'])
    vi.spyOn(api, 'fetchGreetingAudio').mockResolvedValue(saludo)

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))

    await waitFor(() => expect(api.fetchGreetingAudio).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    const audios = document.querySelectorAll('audio')
    expect(audios).toHaveLength(2)
    const [saludoAudio, contextoAudio] = Array.from(audios)

    // Termina el saludo → arranca el audio de contexto.
    fireEvent.ended(saludoAudio)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)

    // Termina el contexto → el botón vuelve a su estado inicial.
    fireEvent.ended(contextoAudio)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('pausa al presionar de nuevo mientras suena', async () => {
    const saludo = new Blob(['saludo-mp3'])
    vi.spyOn(api, 'fetchGreetingAudio').mockResolvedValue(saludo)

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    await waitFor(() => screen.getByRole('button', { name: /pausar/i }))

    fireEvent.click(screen.getByRole('button', { name: /pausar/i }))
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDefined()
  })

  it('si falla el saludo, reproduce igual el audio de contexto solo', async () => {
    vi.spyOn(api, 'fetchGreetingAudio').mockRejectedValue(new Error('red caída'))

    render(<NarracionContexto contexto={CONTEXTO_CON_AUDIO} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /pausar/i })).toBeDefined(),
    )
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    // Sin saludo: un solo <audio>, el de contexto.
    expect(document.querySelectorAll('audio')).toHaveLength(1)
  })

  it('no muestra nada si el escenario todavía no tiene audio generado', () => {
    const contextoSinAudio: Context = {
      antes: 'Texto que no está en el índice.',
      ahora: 'Otro texto que tampoco está.',
    }
    const { container } = render(<NarracionContexto contexto={contextoSinAudio} />)
    expect(container.innerHTML).toBe('')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/components/ui/NarracionContexto.test.tsx`
Expected: FAIL — `fetchGreetingAudio` no existe como export espiable, o el
componente no pide ningún saludo todavía (assertions sobre 2 `<audio>` y el
estado "Pausar" tras el `fetch` fallan).

- [ ] **Step 3: Reescribir `NarracionContexto.tsx`**

```typescript
// frontend/src/components/ui/NarracionContexto.tsx
import { Pause, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Context } from './ContextoEscenario'
import { NARRATION } from '../../data/narracion'
import { textoNarracion } from '../../lib/narracionTexto'
import { fetchGreetingAudio } from '../../lib/api'

type Estado = 'inicial' | 'cargando' | 'reproduciendo'

// Botón manual, sin autoplay: quien quiere que se lo lean lo pide, igual que
// nadie contesta solo un teléfono que suena. No depende de SoundContext: eso
// gobierna efectos cortos de interfaz, esto es contenido, con su propio botón.
//
// Dos <audio> encadenados: el saludo se pide al momento (lleva el nombre real
// del participante, no puede ser el mismo archivo estático para todos) y el
// de contexto ya viene resuelto de src/data/narracion.ts. Si el saludo falla
// (red, backend caído), se reproduce igual el de contexto solo: la persona
// pierde el nombre en el audio, no la narración entera.
function NarracionContexto({ contexto }: { contexto: Context }) {
  const [estado, setEstado] = useState<Estado>('inicial')
  const [saludoSrc, setSaludoSrc] = useState<string | null>(null)
  const saludoRef = useRef<HTMLAudioElement>(null)
  const contextoRef = useRef<HTMLAudioElement>(null)
  const src = NARRATION[textoNarracion(contexto)]

  useEffect(() => {
    return () => {
      if (saludoSrc) URL.revokeObjectURL(saludoSrc)
    }
  }, [saludoSrc])

  if (!src) return null

  async function alternar() {
    if (estado !== 'inicial') {
      saludoRef.current?.pause()
      contextoRef.current?.pause()
      setEstado('inicial')
      return
    }

    setEstado('cargando')
    try {
      const blob = await fetchGreetingAudio()
      setSaludoSrc(URL.createObjectURL(blob))
      // El <audio> del saludo recién se monta con este `src` en el próximo
      // render; se reproduce desde su propio manejador `onCanPlay` (ver JSX).
    } catch {
      setEstado('reproduciendo')
      void contextoRef.current?.play()
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={alternar}
        disabled={estado === 'cargando'}
        className="inline-flex items-center gap-2 rounded-md border border-ticket-edge px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas-inset"
      >
        {estado === 'reproduciendo' ? (
          <Pause aria-hidden className="size-4" strokeWidth={2} />
        ) : (
          <Volume2 aria-hidden className="size-4" strokeWidth={2} />
        )}
        {estado === 'cargando'
          ? 'Cargando…'
          : estado === 'reproduciendo'
            ? 'Pausar narración'
            : 'Escuchar el contexto'}
      </button>
      {saludoSrc && (
        <audio
          ref={saludoRef}
          src={saludoSrc}
          onCanPlay={(event) => {
            if (estado === 'cargando') {
              setEstado('reproduciendo')
              void event.currentTarget.play()
            }
          }}
          onEnded={() => void contextoRef.current?.play()}
        />
      )}
      <audio
        ref={contextoRef}
        src={src}
        onEnded={() => setEstado('inicial')}
      />
    </div>
  )
}

export default NarracionContexto
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/components/ui/NarracionContexto.test.tsx`
Expected: PASS (6 tests). Si el test de "encadena el audio de contexto al
terminar" falla porque `onCanPlay` no dispara en jsdom (jsdom no simula la
carga real de medios), reemplazar esa aserción por disparar el evento a mano:
`fireEvent.canPlay(saludoAudio)` antes de esperar el estado "Pausar", y
ajustar el componente si hace falta para que el primer `play()` ocurra en
`onCanPlay` de forma consistente con eso.

- [ ] **Step 5: Correr toda la suite del frontend para confirmar que nada más se rompió**

Run: `cd frontend && npx vitest run`
Expected: todos los archivos en verde.

- [ ] **Step 6: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/NarracionContexto.tsx frontend/src/components/ui/NarracionContexto.test.tsx
git commit -m "feat(frontend): encadenar el saludo personalizado con el audio de contexto"
```

---

## Task 6: Verificación manual en navegador

**Files:** ninguno (solo verificación, sin cambios de código)

- [ ] **Step 1: Levantar backend y frontend**

Confirmar que `identidad` corre con el `CARTESIA_API_KEY` nuevo cargado
(reiniciar el proceso si Task 3 se hizo con el servicio ya arriba) y que el
frontend sigue apuntando a él.

- [ ] **Step 2: Iniciar sesión con una cuenta de prueba y abrir un escenario**

Entrar con una cuenta que tenga `nombre` real en la base (ej. la cuenta de
prueba `prueba.insignia@safeweb.test`), abrir cualquier escenario, y
presionar "Escuchar el contexto".

- [ ] **Step 3: Confirmar el audio completo**

Verificar de oído: primero dice "Hola, {nombre}. Esto es lo que te está
pasando:" y sin corte perceptible sigue el contexto del escenario. Confirmar
que el botón pasa por "Cargando…" → "Pausar narración" → vuelve a "Escuchar
el contexto" al terminar.

- [ ] **Step 4: Probar el camino de error**

Apagar temporalmente el backend (o cortar la red) y presionar el botón:
confirmar que igual sí se escucha el contexto (sin el nombre), en vez de que
el botón quede roto o sin reaccionar.

- [ ] **Step 5: Revisar la consola del navegador**

Confirmar que no hay errores nuevos en consola durante el flujo completo.
