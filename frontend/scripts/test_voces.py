"""Pruebas locales del generador de audios estáticos."""

import asyncio
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from frontend.scripts import voces


class FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return b"ID3audio-cartesia"


class VoiceGeneratorTests(unittest.TestCase):
    def test_vishing_usa_voces_cartesia_predeterminadas_sin_ids_en_entorno(self):
        requests = []

        def fake_urlopen(request, timeout):
            requests.append(request)
            return FakeResponse()

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "lineas.json"
            source.write_text(json.dumps([
                {"escenario": "AntifraudeBanco", "texto": "Banco seguro."},
                {"escenario": "DevolucionSri", "texto": "Devolución pendiente."},
                {"escenario": "LlamadaPerdida", "texto": "Espere en línea."},
            ]), encoding="utf-8")
            with patch.multiple(voces, RAIZ=root, AUDIOS=root / "public" / "voz",
                                INDICE=root / "voces.ts"), \
                 patch("sys.argv", ["voces.py", str(source)]), \
                 patch.dict("os.environ", {"CARTESIA_API_KEY": "clave-de-prueba"}, clear=True), \
                 patch.object(voces, "sintetizar", AsyncMock(side_effect=RuntimeError("se eligió Edge"))), \
                 patch.object(voces, "urlopen", side_effect=fake_urlopen):
                self.assertEqual(asyncio.run(voces.main()), 0)

            self.assertEqual(
                [json.loads(request.data)["voice"] for request in requests],
                [
                    "4b5112be-c461-44a2-a66b-0dd7f98db4a0",
                    "b4b8e2af-6139-466e-a93a-30c20d2e1fc5",
                    "4663e61a-a9c2-40e1-94c5-c461ed9d3d31",
                ],
            )
            self.assertEqual(len(list((root / "public" / "voz").glob("*.mp3"))), 3)

    def test_sin_clave_cartesia_falla_antes_de_tocar_indice_y_audios(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "lineas.json"
            source.write_text(json.dumps([
                {"escenario": "AntifraudeBanco", "texto": "Banco seguro."},
            ]), encoding="utf-8")
            audio = root / "public" / "voz" / "original.mp3"
            audio.parent.mkdir(parents=True)
            audio.write_bytes(b"audio-anterior")
            index = root / "voces.ts"
            index.write_text("indice anterior", encoding="utf-8")
            errors = io.StringIO()
            with patch.multiple(voces, RAIZ=root, AUDIOS=audio.parent, INDICE=index), \
                 patch("sys.argv", ["voces.py", str(source)]), \
                 patch.dict("os.environ", {}, clear=True), \
                 patch.object(voces, "sintetizar", AsyncMock(side_effect=RuntimeError("se eligió Edge"))), \
                 contextlib.redirect_stderr(errors):
                self.assertEqual(asyncio.run(voces.main()), 1)

            self.assertIn("falta CARTESIA_API_KEY", errors.getvalue())
            self.assertEqual(audio.read_bytes(), b"audio-anterior")
            self.assertEqual(index.read_text(encoding="utf-8"), "indice anterior")
            self.assertEqual([path.name for path in audio.parent.iterdir()], ["original.mp3"])

    def test_llamadas_bancarias_comparten_voz_cartesia_y_nota_externa_conserva_edge(self):
        requests = []

        def fake_urlopen(request, timeout):
            requests.append((request, timeout))
            return FakeResponse()

        class FakeCommunicate:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

            async def save(self, path):
                Path(path).write_bytes(b"ID3audio-edge")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "lineas.json"
            source.write_text(json.dumps([
                {"escenario": "AntifraudeBanco", "texto": "Buenos días."},
                {"escenario": "BancoConfirma", "texto": "Su tarjeta está activa."},
                {"escenario": "TarjetaBloqueada", "texto": "Confirme el bloqueo."},
                {"escenario": "CambioNumero", "texto": "Soy tu hijo."},
            ]), encoding="utf-8")
            (root / "public" / "voz").mkdir(parents=True)
            with patch.multiple(voces, RAIZ=root, AUDIOS=root / "public" / "voz",
                                INDICE=root / "voces.ts"), \
                 patch("sys.argv", ["voces.py", str(source)]), \
                 patch.dict("os.environ", {
                     "CARTESIA_API_KEY": "clave-de-prueba",
                     "CARTESIA_VOICE_MALE": "voz-banco",
                     "CARTESIA_VOICE_FEMALE": "voz-mujer",
                     "CARTESIA_VOICE_IVR": "voz-centralita",
                 }), \
                 patch.object(voces, "urlopen", side_effect=fake_urlopen, create=True), \
                 patch.object(voces.edge_tts, "Communicate", FakeCommunicate):
                self.assertEqual(asyncio.run(voces.main()), 0)

            self.assertEqual(len(requests), 3)
            request, timeout = requests[0]
            self.assertEqual(request.full_url, "https://api.cartesia.ai/tts/bytes")
            self.assertEqual(request.get_method(), "POST")
            self.assertEqual(request.get_header("Authorization"), "Bearer clave-de-prueba")
            self.assertEqual(request.get_header("Cartesia-version"), "2026-08-14")
            self.assertEqual(timeout, 30)
            self.assertEqual(json.loads(request.data), {
                "model_id": "sonic-3.6",
                "transcript": "Buenos días.",
                "voice": "voz-banco",
                "locale": "es-MX",
                "output_format": {"container": "mp3", "sample_rate": 44100, "bit_rate": 128000},
                "generation_config": {"speed": 1.1},
            })
            self.assertEqual(
                [json.loads(item.data)["voice"] for item, _ in requests],
                ["voz-banco", "voz-banco", "voz-banco"],
            )
            index = (root / "voces.ts").read_text(encoding="utf-8")
            self.assertIn('"Buenos días.": "/voz/', index)
            self.assertIn('"Confirme el bloqueo.": "/voz/', index)
            self.assertIn('"Soy tu hijo.": "/voz/', index)
            self.assertEqual(len(list((root / "public" / "voz").glob("*.mp3"))), 4)
            self.assertTrue(any(path.read_bytes() == b"ID3audio-cartesia" for path in (root / "public" / "voz").glob("*.mp3")))
            self.assertTrue(any(path.read_bytes() == b"ID3audio-edge" for path in (root / "public" / "voz").glob("*.mp3")))


if __name__ == "__main__":
    unittest.main()
