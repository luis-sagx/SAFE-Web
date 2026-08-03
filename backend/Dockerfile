# syntax=docker/dockerfile:1
#
# Una sola imagen para los dos microservicios: comparten dependencias y
# `libs/comun`, así que construirlas por separado duplicaría el `pnpm install`
# sin ganar nada. Lo que cambia es el ARG APP, que decide qué migraciones se
# aplican y qué `main.js` arranca.
#
#   docker build --build-arg APP=identidad     ./backend
#   docker build --build-arg APP=entrenamiento ./backend

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# `pnpm build` genera los dos clientes de Prisma y compila las dos apps.
# `prisma generate` no necesita base de datos porque la URL se lee de
# process.env en los prisma.*.config.ts.
RUN pnpm build

# ---------- runtime ----------
FROM node:24-alpine AS runtime
ARG APP
# Se fija como ENV y no solo como ARG: el CMD la necesita en tiempo de
# ejecución, y un ARG solo existe durante el build.
ENV APP=${APP}
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=build /app/dist ./dist
# `dist/` refleja la estructura de la raíz del proyecto (dist/apps, dist/libs),
# así que las rutas relativas al cliente de Prisma que emite tsc son relativas
# a dist/. Por eso `generated` va DOS veces: dentro de dist/ para los servicios
# compilados, y en la raíz para los scripts de prisma/, que corren sin compilar.
COPY --from=build /app/generated ./dist/generated
COPY --from=build /app/generated ./generated
COPY prisma ./prisma
COPY prisma.identidad.config.ts prisma.entrenamiento.config.ts ./

# OWASP Docker Security: el proceso nunca corre como root.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Cada servicio aplica SOLO sus migraciones, con su propia URL y su propio rol
# de Postgres: el contenedor queda consistente con su esquema sin un paso
# manual que se pueda olvidar en el servidor propio, y ninguno puede tocar el
# schema del otro.
#
# Se invoca el binario de prisma directamente y no `pnpm prisma`: corepack
# intentaría descargar pnpm desde el registro al arrancar, y el contenedor debe
# poder levantar en un servidor sin salida a internet.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config prisma.${APP}.config.ts && node dist/apps/${APP}/src/main"]
