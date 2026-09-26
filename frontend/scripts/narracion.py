#!/usr/bin/env python3
"""Sintetiza a MP3 el contexto (antes + ahora + "Tu misión...") de cada escenario.

Igual que scripts/voces.py, pero para el audio de la pantalla de briefing en
vez de las llamadas de vishing: se genera una sola vez y se sirve como
archivo estático en public/narracion/, en vez de sintetizarse en el
navegador, para que suene igual para todo el mundo.

Usa una sola voz de Cartesia para las 53 escenarios (a diferencia de las
llamadas, aquí no hay que distinguir quién habla: es siempre el mismo
narrador contando el contexto).

El nombre de cada archivo es el hash del texto, y el índice que consume el
frontend (src/data/narracion.ts) va indexado por el texto entero: si alguien
retoca el guion, el audio deja de encontrarse en vez de seguir sonando con el
texto viejo. El test de narracion.test.ts avisa cuando eso pasa.

Uso, desde frontend/ (con CARTESIA_API_KEY en .env):

    VITE_NARRACION=1 npx vitest run --reporter=verbose src/secciones/narracion \\
      | python3 scripts/narracion.py -

También acepta la ruta de un JSON con la misma lista de {escenario, texto}.
"""

import hashlib
import json
import os
import re
import sys
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parent.parent
AUDIOS = RAIZ / "public" / "narracion"
INDICE = RAIZ / "src" / "data" / "narracion.ts"
ENV = RAIZ / ".env"

# Ximena, Calm Navigator: voz femenina de español latino, estable y clara,
# pensada para experiencias guiadas (ver ficha de la voz en Cartesia).
VOZ_ID = "3597a26f-80ef-4bd5-8101-9699bc764917"
MODELO = "sonic-2"

CABECERA = '''/**
 * Generado por scripts/narracion.py, no editar a mano.
 *
 * Del texto narrado del contexto de un escenario (antes + ahora + "Tu
 * misión...") al MP3 con esa narración. Igual que src/data/voces.ts: la
 * clave es el texto entero, así que si el guion cambia el audio deja de
 * encontrarse en vez de seguir sonando con el texto viejo. El test de
 * narracion.test.ts avisa cuando eso pasa.
 */
export const NARRATION: Record<string, string> = {
'''


def clave_api() -> str:
    if ENV.exists():
        for linea in ENV.read_text(encoding="utf-8").splitlines():
            if linea.startswith("CARTESIA_API_KEY="):
                return linea.split("=", 1)[1].strip()
    clave = os.environ.get("CARTESIA_API_KEY")
    if not clave:
        raise SystemExit("falta CARTESIA_API_KEY en frontend/.env o en el entorno")
    return clave


def nombre(texto: str) -> str:
    huella = hashlib.sha1(
        f"{VOZ_ID}\n{texto}".encode("utf-8"), usedforsecurity=False
    ).hexdigest()
    return huella[:12] + ".mp3"


def ruta_audio_segura(nombre_archivo: str) -> Path:
    """Resuelve un audio y garantiza que permanezca dentro de public/narracion."""
    base = AUDIOS.resolve()
    candidata = (AUDIOS / nombre_archivo).resolve()
    try:
        candidata.relative_to(base)
    except ValueError as error:
        raise ValueError("la ruta del audio sale del directorio permitido") from error
    return candidata


def entrada_segura(argumento: str) -> Path:
    """Acepta JSON externo solo dentro del checkout del frontend."""
    candidata = Path(argumento).resolve(strict=True)
    try:
        candidata.relative_to(RAIZ.resolve())
    except ValueError as error:
        raise ValueError("la entrada debe estar dentro del frontend") from error
    if not candidata.is_file():
        raise ValueError("la entrada no es un archivo")
    return candidata


def sintetizar(texto: str, clave: str, destino: Path) -> None:
    respuesta = requests.post(
        "https://api.cartesia.ai/tts/bytes",
        headers={
            "X-API-Key": clave,
            "Cartesia-Version": "2024-11-13",
            "Content-Type": "application/json",
        },
        json={
            "model_id": MODELO,
            "transcript": texto,
            "voice": {"mode": "id", "id": VOZ_ID},
            "output_format": {
                "container": "mp3",
                "sample_rate": 44100,
                "bit_rate": 128000,
            },
            "language": "es",
        },
        timeout=60,
    )
    respuesta.raise_for_status()
    destino.write_bytes(respuesta.content)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    if sys.argv[1] == "-":
        salida = sys.stdin.read()
        entre = re.search(r"NARRACION_INICIO(.*?)NARRACION_FIN", salida, re.S)
        if not entre:
            print("no encontré el volcado de textos en la entrada", file=sys.stderr)
            return 1
        lineas = json.loads(entre.group(1))
    else:
        try:
            entrada = entrada_segura(sys.argv[1])
        except (OSError, ValueError) as error:
            print(f"entrada no válida: {error}", file=sys.stderr)
            return 1
        lineas = json.loads(entrada.read_text(encoding="utf-8"))

    clave = clave_api()
    AUDIOS.mkdir(parents=True, exist_ok=True)

    indice = {}
    vivos = set()
    for i, linea in enumerate(lineas, 1):
        texto = linea["texto"]
        archivo = ruta_audio_segura(nombre(texto))
        indice[texto] = f"/narracion/{archivo.name}"
        vivos.add(archivo.name)
        if archivo.exists():
            print(f"[{i}/{len(lineas)}] ya estaba: {archivo.name}")
            continue
        print(f"[{i}/{len(lineas)}] {linea['escenario']}: {texto[:45]}…")
        sintetizar(texto, clave, archivo)

    # Igual que en voces.py: los audios de escenarios que ya no existen, o
    # cuyo guion cambió, se borran para que la carpeta no acumule tomas
    # viejas sin usar.
    for viejo in AUDIOS.glob("*.mp3"):
        if viejo.name not in vivos:
            print(f"sobra, se borra: {viejo.name}")
            ruta_audio_segura(viejo.name).unlink()

    cuerpo = "".join(
        f"  {json.dumps(texto, ensure_ascii=False)}: {json.dumps(url)},\n"
        for texto, url in sorted(indice.items())
    )
    INDICE.write_text(CABECERA + cuerpo + "}\n", encoding="utf-8")
    print(f"\n{len(indice)} escenarios · índice en {INDICE.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
