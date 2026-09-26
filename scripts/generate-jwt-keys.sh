#!/bin/sh
# Genera los dos pares de claves ES256 (P-256) de los JWT y los imprime listos
# para pegar en el .env, cada PEM en base64 de una línea:
#
#   scripts/generate-jwt-keys.sh >> .env
#
# - IDENTIDAD_*: firma access y refresh tokens. La privada solo la recibe
#   `identidad`; `entrenamiento` recibe la pública para verificar sesiones.
# - ENTRENAMIENTO_*: firma la atestación del certificado. La privada solo la
#   recibe `entrenamiento`; `identidad` recibe la pública.
#
# Cambiar el par de IDENTIDAD cierra todas las sesiones abiertas.
set -eu

for service in IDENTIDAD ENTRENAMIENTO; do
  private="$(openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256)"
  public="$(printf '%s\n' "$private" | openssl pkey -pubout)"
  echo "${service}_JWT_PRIVATE_KEY=$(printf '%s\n' "$private" | base64 | tr -d '\n')"
  echo "${service}_JWT_PUBLIC_KEY=$(printf '%s\n' "$public" | base64 | tr -d '\n')"
done
