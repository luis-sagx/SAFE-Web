import { describe, expect, it } from 'vitest'
import { NARRATION } from '../data/narracion'
import { textoNarracion } from '../lib/narracionTexto'
import type { Context } from '../components/ui/ContextoEscenario'
import { CONTEXT as correoDatosTercerosContext } from './asistentes-ia/CorreoDatosTerceros'
import { CONTEXT as informeEscolarContext } from './asistentes-ia/InformeEscolar'
import { CONTEXT as invitacionCumpleanosContext } from './asistentes-ia/InvitacionCumpleanos'
import { CONTEXT as resumenDocumentoInternoContext } from './asistentes-ia/ResumenDocumentoInterno'
import { CONTEXT as arriendoAnticipadoContext } from './estafa/ArriendoAnticipado'
import { CONTEXT as gananciaGarantizadaContext } from './estafa/GananciaGarantizada'
import { CONTEXT as mitadDePrecioContext } from './estafa/MitadDePrecio'
import { CONTEXT as pagoLavadoraContext } from './estafa/PagoLavadora'
import { CONTEXT as saldoContableContext } from './estafa/SaldoContable'
import { CONTEXT as tareasPagadasContext } from './estafa/TareasPagadas'
import { CONTEXT as visitaDepartamentoContext } from './estafa/VisitaDepartamento'
import { CONTEXT as vueltoDeMasContext } from './estafa/VueltoDeMas'
import { CONTEXT as cableComprometidoContext } from './fisico/CableComprometido'
import { CONTEXT as codigoQRCafeContext } from './fisico/CodigoQRCafe'
import { CONTEXT as descargaProgramasPiratasContext } from './fisico/DescargaProgramasPiratas'
import { CONTEXT as privacidadClavesContext } from './fisico/PrivacidadClaves'
import { CONTEXT as puertosFriosColdAisleContext } from './fisico/PuertosFriosColdAisle'
import { CONTEXT as salidaSeguraContext } from './fisico/SalidaSegura'
import { CONTEXT as tarjetaClonadaContext } from './fisico/TarjetaClonada'
import { CONTEXT as trampaUSBContext } from './fisico/TrampaUSB'
import { CONTEXT as avisoFiltracionContext } from './phishing/AvisoFiltracion'
import { CONTEXT as claveCaducadaContext } from './phishing/ClaveCaducada'
import { CONTEXT as cobroDirigidoContext } from './phishing/CobroDirigido'
import { CONTEXT as facturaSriContext } from './phishing/FacturaSri'
import { CONTEXT as loteriaPremiadaContext } from './phishing/LoteriaPremiada'
import { CONTEXT as quishingActualiceContext } from './phishing/QuishingActualice'
import { CONTEXT as rolDePagosContext } from './phishing/RolDePagos'
import { CONTEXT as secuestroHiloContext } from './phishing/SecuestroHilo'
import { CONTEXT as sesionBogotaContext } from './phishing/SesionBogota'
import { CONTEXT as alertaConsumoContext } from './smishing/AlertaConsumo'
import { CONTEXT as bajaSuscripcionContext } from './smishing/BajaSuscripcion'
import { CONTEXT as bonoEstadoContext } from './smishing/BonoEstado'
import { CONTEXT as citacionTransitoContext } from './smishing/CitacionTransito'
import { CONTEXT as codigoReenviadoContext } from './smishing/CodigoReenviado'
import { CONTEXT as entregaProgramadaContext } from './smishing/EntregaProgramada'
import { CONTEXT as paqueteRetenidoContext } from './smishing/PaqueteRetenido'
import { CONTEXT as tarjetaBloqueadaContext } from './smishing/TarjetaBloqueada'
import { CONTEXT as cambioNumeroContext } from './suplantacion/CambioNumero'
import { CONTEXT as clonaronTuPerfilContext } from './suplantacion/ClonaronTuPerfil'
import { CONTEXT as codigoPrestadoContext } from './suplantacion/CodigoPrestado'
import { CONTEXT as cuentaHackeadaContext } from './suplantacion/CuentaHackeada'
import { CONTEXT as jefeUrgenteContext } from './suplantacion/JefeUrgente'
import { CONTEXT as numeroNuevoRealContext } from './suplantacion/NumeroNuevoReal'
import { CONTEXT as perfilClonadoContext } from './suplantacion/PerfilClonado'
import { CONTEXT as vozClonadaContext } from './suplantacion/VozClonada'
import { CONTEXT as antifraudeBancoContext } from './vishing/AntifraudeBanco'
import { CONTEXT as bancoConfirmaContext } from './vishing/BancoConfirma'
import { CONTEXT as devolucionSriContext } from './vishing/DevolucionSri'
import { CONTEXT as encuestaDatosContext } from './vishing/EncuestaDatos'
import { CONTEXT as entregaCourierContext } from './vishing/EntregaCourier'
import { CONTEXT as llamadaPerdidaContext } from './vishing/LlamadaPerdida'
import { CONTEXT as premioSorteoContext } from './vishing/PremioSorteo'
import { CONTEXT as soporteTecnicoContext } from './vishing/SoporteTecnico'

/// El contexto de las 53 escenarios: de aquí sale tanto la comprobación de
/// que cada uno tiene su audio generado como la lista que consume
/// scripts/narracion.py. Cualquier escenario nuevo con narración entra aquí.
const ESCENARIOS: Record<string, Context> = {
  CorreoDatosTerceros: correoDatosTercerosContext,
  InformeEscolar: informeEscolarContext,
  InvitacionCumpleanos: invitacionCumpleanosContext,
  ResumenDocumentoInterno: resumenDocumentoInternoContext,
  ArriendoAnticipado: arriendoAnticipadoContext,
  GananciaGarantizada: gananciaGarantizadaContext,
  MitadDePrecio: mitadDePrecioContext,
  PagoLavadora: pagoLavadoraContext,
  SaldoContable: saldoContableContext,
  TareasPagadas: tareasPagadasContext,
  VisitaDepartamento: visitaDepartamentoContext,
  VueltoDeMas: vueltoDeMasContext,
  CableComprometido: cableComprometidoContext,
  CodigoQRCafe: codigoQRCafeContext,
  DescargaProgramasPiratas: descargaProgramasPiratasContext,
  PrivacidadClaves: privacidadClavesContext,
  PuertosFriosColdAisle: puertosFriosColdAisleContext,
  SalidaSegura: salidaSeguraContext,
  TarjetaClonada: tarjetaClonadaContext,
  TrampaUSB: trampaUSBContext,
  AvisoFiltracion: avisoFiltracionContext,
  ClaveCaducada: claveCaducadaContext,
  CobroDirigido: cobroDirigidoContext,
  FacturaSri: facturaSriContext,
  LoteriaPremiada: loteriaPremiadaContext,
  QuishingActualice: quishingActualiceContext,
  RolDePagos: rolDePagosContext,
  SecuestroHilo: secuestroHiloContext,
  SesionBogota: sesionBogotaContext,
  AlertaConsumo: alertaConsumoContext,
  BajaSuscripcion: bajaSuscripcionContext,
  BonoEstado: bonoEstadoContext,
  CitacionTransito: citacionTransitoContext,
  CodigoReenviado: codigoReenviadoContext,
  EntregaProgramada: entregaProgramadaContext,
  PaqueteRetenido: paqueteRetenidoContext,
  TarjetaBloqueada: tarjetaBloqueadaContext,
  CambioNumero: cambioNumeroContext,
  ClonaronTuPerfil: clonaronTuPerfilContext,
  CodigoPrestado: codigoPrestadoContext,
  CuentaHackeada: cuentaHackeadaContext,
  JefeUrgente: jefeUrgenteContext,
  NumeroNuevoReal: numeroNuevoRealContext,
  PerfilClonado: perfilClonadoContext,
  VozClonada: vozClonadaContext,
  AntifraudeBanco: antifraudeBancoContext,
  BancoConfirma: bancoConfirmaContext,
  DevolucionSri: devolucionSriContext,
  EncuestaDatos: encuestaDatosContext,
  EntregaCourier: entregaCourierContext,
  LlamadaPerdida: llamadaPerdidaContext,
  PremioSorteo: premioSorteoContext,
  SoporteTecnico: soporteTecnicoContext,
}

const TEXTS = Object.entries(ESCENARIOS).map(([escenario, contexto]) => ({
  escenario,
  texto: textoNarracion(contexto),
}))

describe('narración del contexto de cada escenario', () => {
  it('cada escenario tiene su audio de contexto generado', () => {
    const withoutAudio = TEXTS.filter(({ texto }) => !NARRATION[texto]).map(({ escenario }) => escenario)
    expect(withoutAudio, 'faltan audios: vuelve a correr scripts/narracion.py').toEqual([])
  })

  // Igual que en voces.test.ts: solo vitest sabe cargar los .tsx del
  // proyecto, así que la lista para el generador sale por consola entre
  // marcas en vez de mantenerse a mano en un script aparte.
  //
  //   VITE_NARRACION=1 npx vitest run --reporter=verbose src/secciones/narracion \
  //     | python3 scripts/narracion.py -
  it.runIf(Boolean(import.meta.env.VITE_NARRACION))('vuelca los textos para el generador', () => {
    console.log(`NARRACION_INICIO${JSON.stringify(TEXTS)}NARRACION_FIN`)
  })
})
