#!/usr/bin/env python3
"""Crea y confirma las cuentas que usa tests/carga/aula.js.

Se corre EN EL SERVIDOR DE PRUEBAS (necesita llegar al contenedor de Postgres
para confirmar los correos), nunca en producción:

    CONFIRMO_ENTORNO_DE_PRUEBA=si python3 tests/carga/seed_accounts.py \\
        --base-url http://localhost:8080 --count 100

- Registra por el API, no por SQL: nombre, apellido y correo se guardan
  cifrados y la cédula como HMAC, y solo `identidad` tiene las claves.
- El registro envía un correo de confirmación. En el entorno de prueba
  RESEND_API_KEY debe ser una clave de mentira: si no, son 100 correos a
  @ejemplo.ec que rebotan y dañan la reputación del remitente.
- Confirma solo las cuentas creadas durante esta corrida (por `createdAt`), sin
  tocar las demás.
- Es idempotente: una cuenta que ya existe se salta.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

PASSWORD = 'Clave-Larga-123!'
COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2]


def cedula(index: int) -> str:
    """Cédula válida (módulo 10) y distinta por índice: provincia 17, tercer
    dígito 0 (persona natural) y el índice en los 6 siguientes."""
    base = f'170{index:06d}'
    total = sum(
        (p - 9 if (p := int(d) * c) >= 10 else p)
        for d, c in zip(base, COEFFICIENTS)
    )
    return base + str((10 - total % 10) % 10)


def db_container() -> str:
    # Por etiqueta, igual que scripts/backup-db.sh: no depende del .env.
    project = os.environ.get('COMPOSE_PROJECT_NAME', 'safe-web')
    out = subprocess.run(
        ['docker', 'ps', '-q',
         '--filter', f'label=com.docker.compose.project={project}',
         '--filter', 'label=com.docker.compose.service=db'],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    if not out:
        sys.exit(f'El contenedor db de {project} no está corriendo.')
    return out


def psql(container: str, sql: str) -> str:
    return subprocess.run(
        ['docker', 'exec', container, 'sh', '-c',
         'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "$0"', sql],
        check=True, capture_output=True, text=True,
    ).stdout.strip()


def register(base_url: str, index: int) -> int:
    body = json.dumps({
        'nombre': 'Carga',
        'apellido': 'Prueba',
        'email': f'carga{index:04d}@ejemplo.ec',
        'cedula': cedula(index),
        'password': PASSWORD,
    }).encode()
    request = urllib.request.Request(
        f'{base_url}/api/auth/register', data=body,
        headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--base-url', default='http://localhost:8080')
    parser.add_argument('--count', type=int, default=100)
    args = parser.parse_args()

    if os.environ.get('CONFIRMO_ENTORNO_DE_PRUEBA') != 'si':
        sys.exit('Solo para el entorno de pruebas: '
                 'exporta CONFIRMO_ENTORNO_DE_PRUEBA=si para continuar.')

    container = db_container()
    started = psql(container, 'SELECT now()')

    created = existing = 0
    for index in range(args.count):
        status = register(args.base_url, index)
        if status == 429:
            # El techo por IP de nginx (120/min): se espera y se reintenta.
            time.sleep(30)
            status = register(args.base_url, index)
        if status in (200, 201):
            created += 1
        elif status == 409:
            existing += 1
        else:
            sys.exit(f'carga{index:04d}: registro respondió {status}')
        # Por debajo del techo de nginx, para no depender del reintento.
        time.sleep(0.6)

    confirmed = psql(
        container,
        'WITH c AS (UPDATE identidad."Participant" SET "emailConfirmedAt" = now() '
        f'WHERE "emailConfirmedAt" IS NULL AND "createdAt" >= \'{started}\' '
        'RETURNING 1) SELECT count(*) FROM c',
    )
    print(f'creadas {created}, ya existían {existing}, confirmadas {confirmed}')


if __name__ == '__main__':
    main()
