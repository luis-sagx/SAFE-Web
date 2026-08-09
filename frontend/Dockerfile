# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

# pnpm-workspace.yaml va aquí y no en el COPY de después: lleva los overrides
# (ver el archivo), y sin él `--frozen-lockfile` encuentra un lock que no
# coincide con lo que declara el proyecto y aborta.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---------- runtime ----------
# Imagen no privilegiada de Nginx (escucha en 8080 y corre como usuario sin
# privilegios), acorde al OWASP Docker Security Cheat Sheet.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy-comun.inc /etc/nginx/conf.d/proxy-comun.inc
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
