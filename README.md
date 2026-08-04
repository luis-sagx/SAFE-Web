# SAFE Web

Ambientes interactivos de simulación para educar a usuarios no técnicos frente a
ciberamenazas en el Ecuador. Trabajo de Integración Curricular — Carrera de
Software, Departamento de Ciencias de la Computación.

El participante se registra con su nombre, apellido, correo y cédula —esta
última nunca se almacena, solo su huella, y solo sirve para que nadie se
registre dos veces—, juega escenarios simulados de fraude que registran cada
decisión, y el investigador exporta esos resultados —identificados solo por un
seudónimo— para compararlos con un pre-test y un post-test aplicados aparte.

## Estructura

| Carpeta | Qué es |
|---|---|
| `frontend/` | SPA React + Vite + TypeScript. Los escenarios, el catálogo y el gateway Nginx. |
| `backend/` | Dos microservicios NestJS + Prisma: `identidad` y `entrenamiento`. |
| `db-init/` | Un rol y un schema de Postgres por servicio, sin permisos cruzados. |
| `docs/` | Arquitectura, justificación de tecnologías y diseño de escenarios. |

### Los dos servicios

| Servicio | Puerto | Rutas | Qué sabe |
|---|---|---|---|
| `identidad` | 3001 | `/api/auth/*` | Nombre, correo, contraseña. Firma el JWT. |
| `entrenamiento` | 3002 | `/api/runs/*` | Las corridas del estudio, identificadas solo por seudónimo. |

No se llaman entre sí: el JWT lleva lo que ambos necesitan y cada uno lo verifica
localmente. El servicio que exporta el CSV **no tiene forma de leer un dato
personal** — ni tabla, ni permiso de Postgres.

## Empezar

```bash
cp .env.example .env          # rellenar las contraseñas y JWT_SECRET
docker compose up -d --build
docker compose exec identidad node prisma/seed.mts --email tu.correo@espe.edu.ec
```

Desarrollo sin contenedores:

```bash
cd frontend && pnpm install && pnpm dev             # http://localhost:5173
cd backend  && pnpm install
pnpm start:identidad                                # http://localhost:3001/api
pnpm start:entrenamiento                            # http://localhost:3002/api
```

## Antes de escribir código

Lee **[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)**. Es normativo: define
cómo se agrega un escenario, cómo se registran los resultados y qué reglas de
privacidad no se negocian. Aplica igual a personas y a agentes de IA.

Documentos de apoyo:

- [`docs/DESIGN.md`](docs/DESIGN.md) — sistema de diseño (Tailwind, solo modo claro).
- [`docs/justificacion-tecnologias.md`](docs/justificacion-tecnologias.md) — por qué cada tecnología, con fuentes.
- [`docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md`](docs/superpowers/specs/2026-07-25-escenarios-ciberamenazas-design.md) — diseño pedagógico de los 35 escenarios.
