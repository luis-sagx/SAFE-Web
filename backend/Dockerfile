# syntax=docker/dockerfile:1
#
# Una sola imagen para los dos microservicios: comparten dependencias y
# `libs/comun`, así que construirlas por separado duplicaría el `pnpm install`
# sin ganar nada. Lo que cambia es el ARG APP, que decide qué migraciones se
# aplican y qué `main.js` arranca.
#
#   docker build --build-arg APP=identidad     ./backend
#   docker build --build-arg APP=entrenamiento ./backend

# ---------- base ----------
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# ---------- build ----------
FROM base AS build
# El store de pnpm va en un cache mount: acelera los rebuilds y no queda en
# ninguna capa. `sharing=locked` porque `deps` usa el mismo store en paralelo.
RUN --mount=type=cache,id=pnpm-store-backend,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile

COPY . .
# `pnpm build` genera los dos clientes de Prisma y compila las dos apps.
# `prisma generate` no necesita base de datos porque la URL se lee de
# process.env en los prisma.*.config.ts.
RUN pnpm build

# ---------- deps ----------
# Solo dependencias de producción. Tiene que ser `--prod` explícito: pnpm 11
# ignora NODE_ENV=production y, sin la bandera, instalaba jest, eslint,
# typescript y compañía en la imagen final.
FROM base AS deps
RUN --mount=type=cache,id=pnpm-store-backend,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prod

# ---------- runtime ----------
# Sin corepack ni pnpm: se copia `node_modules` ya resuelto, así la imagen no
# arrastra el store de pnpm ni sus cachés (antes, ~840 MB).
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=build /app/dist ./dist
# `dist/` refleja la estructura de la raíz del proyecto (dist/apps, dist/libs),
# así que las rutas relativas al cliente de Prisma que emite tsc son relativas
# a dist/. Por eso `generated` va DOS veces: dentro de dist/ para los servicios
# compilados, y en la raíz para los scripts de prisma/, que corren sin compilar.
COPY --from=build /app/generated ./dist/generated
COPY --from=build /app/generated ./generated
COPY prisma ./prisma
COPY prisma.identidad.config.ts prisma.entrenamiento.config.ts ./
# seed.mts y backfill-pii.mts importan el cifrado PII desde el fuente .ts (Node
# 24 lo ejecuta sin compilar). Sin este archivo, `docker compose exec identidad
# node prisma/seed.mts` falla con ERR_MODULE_NOT_FOUND. Solo depende de
# node:crypto.
COPY apps/identidad/src/pii/pii.ts ./apps/identidad/src/pii/pii.ts

# OWASP Docker Security: el proceso nunca corre como root.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# APP va al final a propósito: todo lo anterior es idéntico para los dos
# servicios y se reutiliza de caché; declararlo arriba invalidaba cada capa y
# repetía la copia de dependencias por servicio.
#
# Se fija como ENV y no solo como ARG: el CMD la necesita en tiempo de
# ejecución, y un ARG solo existe durante el build.
ARG APP
ENV APP=${APP}

# Cada servicio aplica SOLO sus migraciones, con su propia URL y su propio rol
# de Postgres: el contenedor queda consistente con su esquema sin un paso
# manual que se pueda olvidar en el servidor propio, y ninguno puede tocar el
# schema del otro.
#
# Se invoca el binario de prisma directamente y no `pnpm prisma`: la imagen no
# trae pnpm, y el contenedor debe poder levantar en un servidor sin salida a
# internet.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config prisma.${APP}.config.ts && node dist/apps/${APP}/src/main"]
