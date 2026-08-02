# Trampa Digital

Ambientes interactivos de simulación para educar a usuarios no técnicos frente a
ciberamenazas en el Ecuador. Trabajo de Integración Curricular — Carrera de
Software, Departamento de Ciencias de la Computación.

El participante se registra con su nombre, correo y teléfono, juega escenarios
simulados de fraude que registran cada decisión, y el investigador exporta esos
resultados —identificados solo por un seudónimo— para compararlos con un
pre-test y un post-test aplicados aparte.

## Estructura

| Carpeta | Qué es |
|---|---|
| `frontend/` | SPA React + Vite + TypeScript. Los escenarios y el catálogo. |
| `backend/` | API NestJS + Prisma. Autenticación y resultados. |
| `docs/` | Arquitectura, justificación de tecnologías y diseño de escenarios. |

## Empezar

```bash
cp .env.example .env          # rellenar POSTGRES_PASSWORD y JWT_SECRET
docker compose up -d --build
docker compose exec api node prisma/seed.mts --email tu.correo@espe.edu.ec
```

Desarrollo sin contenedores:

```bash
cd frontend && pnpm install && pnpm dev     # http://localhost:5173
cd backend  && pnpm install && pnpm start:dev
```

## Antes de escribir código

Lee **[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)**. Es normativo: define
cómo se agrega un escenario, cómo se registran los resultados y qué reglas de
privacidad no se negocian. Aplica igual a personas y a agentes de IA.

Documentos de apoyo:

- [`DESIGN.md`](DESIGN.md) — sistema de diseño (Tailwind, solo modo claro).
- [`docs/justificacion-tecnologias.md`](docs/justificacion-tecnologias.md) — por qué cada tecnología, con fuentes.
- [`docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md`](docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md) — diseño pedagógico de los 35 escenarios.
