# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# `pnpm build` corre `prisma generate && nest build`; generate no necesita base
# de datos porque la URL se lee de process.env en prisma.config.ts.
RUN pnpm build

# ---------- runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY prisma ./prisma
COPY prisma.config.ts ./

# OWASP Docker Security: el proceso nunca corre como root.
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Las migraciones se aplican al arrancar: el contenedor queda consistente con
# el esquema sin un paso manual que se pueda olvidar en el servidor propio.
#
# Se invoca el binario de prisma directamente y no `pnpm prisma`: corepack
# intentaría descargar pnpm desde el registro al arrancar, y el contenedor debe
# poder levantar en un servidor sin salida a internet.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]
