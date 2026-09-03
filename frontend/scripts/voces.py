#!/usr/bin/env python3
"""Sintetiza a MP3 las frases que dice quien llama en los escenarios de vishing.

Las voces se generan una sola vez y se guardan como archivos estáticos en
public/voz/. No se sintetizan en el navegador a propósito: la voz del sistema
cambia de un equipo a otro y en muchos ni siquiera hay una en español, así que
dos participantes habrían oído estímulos distintos y sus corridas no serían
comparables. Con el MP3 la llamada suena igual para todo el mundo.

Usa las voces neuronales de Edge, que son las únicas gratuitas con acento
ecuatoriano (es-EC). El tono importa tanto como el texto: media estafa
telefónica está en la confianza con la que hablan, y una voz robótica avisa de
que algo es falso mucho antes de que el participante escuche lo que dice.

El nombre de cada archivo es el hash de la voz y la frase, y el índice que
consume el frontend (src/data/voces.ts) va indexado por la frase entera: si
alguien retoca el guion o cambia la voz, el audio deja de encontrarse —la línea
se queda muda y el test lo dice— en vez de seguir sonando con el texto viejo.

Uso, desde frontend/ (con un entorno que tenga edge-tts instalado):

    VITE_VOCES=1 npx vitest run --reporter=verbose src/secciones/voces \\
      | python3 scripts/voces.py -

También acepta la ruta de un JSON con la misma lista de {escenario, texto}.
"""

import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
AUDIOS = RAIZ / "public" / "voz"
INDICE = RAIZ / "src" / "data" / "voces.ts"

# Cada voz con su ritmo. Las neuronales leen bien pero leen: a velocidad y tono
# de fábrica suenan a locutor de contestador, y una llamada que suena a máquina
# se descarta antes de escuchar lo que pide, que es justo lo que el escenario
# necesita que no pase. Subirles el ritmo y el tono las acerca a alguien que
# habla por teléfono con prisa.
MUJER = ("es-EC-AndreaNeural", "+12%", "+15Hz")
HOMBRE = ("es-EC-LuisNeural", "+10%", "+8Hz")
# La única que se queda plana a propósito: es una grabación de centralita, y
# que suene a máquina es parte de lo que hay que reconocer.
CENTRALITA = ("es-MX-DaliaNeural", "+0%", "+0Hz")
# Un chico de veintipocos, para las suplantaciones de un hijo: la misma voz que
# oye quien llama al número de verdad, porque el ataque justamente consiste en
# que suene igual.
HIJO = ("es-EC-LuisNeural", "+14%", "+25Hz")

# Quién habla en cada escenario. Las dos del banco comparten la voz de Luis a
# propósito: antifraude-banco y banco-confirma son la misma llamada contada por
# un estafador y por el banco de verdad, y si sonaran distinto el participante
# los distinguiría por el timbre en vez de por lo que le piden, que es justo lo
# que no queremos que aprenda.
VOZ_POR_ESCENARIO = {
    "AntifraudeBanco": HOMBRE,
    "BancoConfirma": HOMBRE,
    "DevolucionSri": MUJER,
    "EncuestaDatos": MUJER,
    "EntregaCourier": HOMBRE,
    "LlamadaPerdida": CENTRALITA,
    "PremioSorteo": MUJER,
    "SoporteTecnico": HOMBRE,
    # El puente de smishing a vishing: el impostor que contesta cuando marcas el
    # número del SMS. Comparte la voz de las otras dos del banco por lo mismo.
    "TarjetaBloqueada": HOMBRE,
    "CambioNumero": HIJO,
    "CodigoPrestado": MUJER,
    "CuentaHackeada": HOMBRE,
    "JefeUrgente": MUJER,
    "NumeroNuevoReal": MUJER,
    "VozClonada": HOMBRE,
    "VueltoDeMas": MUJER,
}
VOZ_POR_DEFECTO = HOMBRE

# Y cuando en una misma escena habla más de una persona, la línea dice quién es.
# Una llamada donde la hija secuestrada y el supuesto policía suenan con la
# misma voz no engaña a nadie, y el escenario dejaría de medir lo que mide.
VOZ_POR_ROL = {
    "hija": ("es-EC-AndreaNeural", "+18%", "+40Hz"),
    "hijo": HIJO,
    "policia": ("es-EC-LuisNeural", "+4%", "-15Hz"),
    "mujer": MUJER,
    "hombre": HOMBRE,
}

CABECERA = '''/**
 * Generado por scripts/voces.py — no editar a mano.
 *
 * De cada frase que dice quien llama en los escenarios de vishing al MP3 con
 * esa frase. Los audios se generan una sola vez y se sirven como archivos
 * estáticos, en vez de sintetizarlos en el navegador: la voz del sistema
 * cambia de un equipo a otro (y en muchos ni existe en español), y dos
 * participantes que oyen voces distintas no hicieron el mismo ejercicio.
 *
 * La clave es la frase entera y no un identificador corto a propósito: si el
 * guion cambia, el audio deja de encontrarse en vez de seguir sonando con el
 * texto viejo. El test de voces.test.ts avisa cuando eso pasa.
 */
export const VOCES: Record<string, string> = {
'''


def nombre(voz: tuple[str, str, str], texto: str) -> str:
    # El ritmo entra en la huella: si se retoca, los audios viejos dejan de
    # cuadrar y se regeneran solos en vez de quedarse mezclados con los nuevos.
    # Solo identifica archivos estáticos; no se usa como firma ni para
    # proteger datos. La marca evita tratar este identificador como secreto.
    huella = hashlib.sha1(
        f"{voz}\n{texto}".encode("utf-8"), usedforsecurity=False
    ).hexdigest()
    return huella[:12] + ".mp3"


def ruta_audio_segura(nombre_archivo: str) -> Path:
    """Resuelve un audio y garantiza que permanezca dentro de public/voz."""
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


async def sintetizar(texto: str, voz: tuple[str, str, str], destino: Path) -> None:
    nombre_voz, ritmo, tono = voz
    await edge_tts.Communicate(text=texto, voice=nombre_voz, rate=ritmo, pitch=tono).save(
        str(destino)
    )


async def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    if sys.argv[1] == "-":
        # El volcado sale entre marcas dentro de la salida de vitest, que trae
        # también su propio informe: se recorta lo de en medio.
        salida = sys.stdin.read()
        entre = re.search(r"VOCES_INICIO(.*?)VOCES_FIN", salida, re.S)
        if not entre:
            print("no encontré el volcado de frases en la entrada", file=sys.stderr)
            return 1
        lineas = json.loads(entre.group(1))
    else:
        try:
            entrada = entrada_segura(sys.argv[1])
        except (OSError, ValueError) as error:
            print(f"entrada no válida: {error}", file=sys.stderr)
            return 1
        lineas = json.loads(entrada.read_text(encoding="utf-8"))

    AUDIOS.mkdir(parents=True, exist_ok=True)

    indice = {}
    vivos = set()
    for i, linea in enumerate(lineas, 1):
        texto = linea["texto"]
        voz = VOZ_POR_ROL.get(linea.get("rol") or "") or VOZ_POR_ESCENARIO.get(
            linea["escenario"], VOZ_POR_DEFECTO
        )
        archivo = ruta_audio_segura(nombre(voz, texto))
        indice[texto] = f"/voz/{archivo.name}"
        vivos.add(archivo.name)
        if archivo.exists():
            print(f"[{i}/{len(lineas)}] ya estaba: {archivo.name}")
            continue
        print(f"[{i}/{len(lineas)}] {voz[0]} {voz[1]}: {texto[:45]}…")
        await sintetizar(texto, voz, archivo)

    # Los audios de frases que ya no dice nadie —o que se grabaron con otra
    # voz— se borran: si no, la carpeta se llena de tomas viejas que nadie sabe
    # si siguen usándose.
    for viejo in AUDIOS.glob("*.mp3"):
        if viejo.name not in vivos:
            print(f"sobra, se borra: {viejo.name}")
            ruta_audio_segura(viejo.name).unlink()

    cuerpo = "".join(
        f"  {json.dumps(texto, ensure_ascii=False)}: {json.dumps(url)},\n"
        for texto, url in sorted(indice.items())
    )
    INDICE.write_text(CABECERA + cuerpo + "}\n", encoding="utf-8")
    print(f"\n{len(indice)} frases · índice en {INDICE.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
