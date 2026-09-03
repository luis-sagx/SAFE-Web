import {
  Mail,
  MessageSquareText,
  Phone,
  ShoppingBag,
  StickyNote,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type Naturaleza = "fraude" | "legitimo";

export interface Seccion {
  id: string;
  titulo: string;
  /** Qué es la amenaza, en lenguaje de alguien que no es técnico. Basada en
   *  los anzuelos reales del diseño pedagógico (ver docs/superpowers/specs). */
  descripcion: string;
  /** Dónde ocurre; va en la insignia de la tarjeta. */
  canal: string;
  Icono: LucideIcon;
}

interface EscenarioBase {
  seccionId: string;
  escenarioId: string;
  /** Describe la situación, nunca el veredicto: el menú no puede delatar
   *  cuáles casos son fraude y cuáles legítimos. */
  titulo: string;
  descripcion: string;
  /** Sube en +1 al editar el guion, para no mezclar corridas de versiones
   *  distintas en el análisis. */
  version: number;
  naturaleza: Naturaleza;
  dificultad: 1 | 2 | 3 | 4 | 5;
  espeja: string | null;
  Component: LazyExoticComponent<ComponentType>;
}

export interface Escenario extends EscenarioBase {
  id: string;
}

export const SECCIONES: Seccion[] = [
  {
    id: "phishing",
    titulo: "Phishing",
    descripcion:
      "Correos que copian a tu banco o al SRI: facturas falsas, códigos QR y alertas que buscan tu clave.",
    canal: "Correo y web",
    Icono: Mail,
  },
  {
    id: "smishing",
    titulo: "Smishing",
    descripcion:
      "Bonos, multas de tránsito y paquetes retenidos que llegan junto a los SMS reales de tu banco.",
    canal: "SMS y WhatsApp",
    Icono: MessageSquareText,
  },
  {
    id: "vishing",
    titulo: "Vishing",
    descripcion:
      "Llamadas de un falso antifraude o soporte técnico que piden un código mientras te apuran.",
    canal: "Llamada telefónica",
    Icono: Phone,
  },
  {
    id: "suplantacion",
    titulo: "Suplantación de identidad",
    descripcion:
      'Un contacto que "cambió de número", un perfil clonado o una voz idéntica pidiendo dinero.',
    canal: "Mensajería y redes",
    Icono: UserRoundX,
  },
  {
    id: "estafa",
    titulo: "Estafa electrónica",
    descripcion:
      "Compras que nunca llegan, un vuelto pedido antes de tiempo o inversiones con ganancia garantizada.",
    canal: "Compra, venta y dinero",
    Icono: ShoppingBag,
  },
  {
    id: "fisico",
    titulo: "Riesgo físico",
    descripcion:
      "Una nota con la clave pegada al monitor o una memoria USB que alguien dejó ahí a propósito.",
    canal: "Oficina y entorno",
    Icono: StickyNote,
  },
];

const BASE: EscenarioBase[] = [
  {
    seccionId: "phishing",
    escenarioId: "factura-sri",
    titulo: "Factura por validar",
    descripcion:
      "Un correo institucional anuncia un comprobante pendiente y da un plazo de 24 horas.",
    // v2: la barra del cliente de correo pasó a ser funcional y sumó cinco
    // finales (responder, reenviar, archivar, eliminar, marcar como spam).
    // v3: el adjunto pasó de .html a un ejecutable .vbs con doble extensión.
    // v4: el atajo del portal abre el portal real en vez de saltar al final.
    // v5: el escenario se juega en un navegador con pestañas; el enlace del
    // correo abre una pestaña nueva y el portal se abre desde los marcadores.
    // Las corridas de versiones distintas no son comparables entre sí: el
    // estímulo que vio cada participante no fue el mismo.
    // v6: el briefing enseña los datos prestados en una tarjeta.
    // v7: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v8: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    // v9: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 9,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "phishing/rol-de-pagos",
    Component: lazy(() => import("../secciones/phishing/FacturaSri")),
  },
  {
    // v2 en los siete: la barra del cliente pasó a ser funcional y sumó cinco
    // finales (responder, reenviar, archivar, eliminar, spam). En los dos
    // legítimos, eliminar y marcar como spam cuentan como fallo.
    seccionId: "phishing",
    escenarioId: "clave-caducada",
    titulo: "Contraseña por caducar",
    descripcion:
      "Soporte técnico avisa que tu clave vence hoy y ofrece un enlace para renovarla.",
    // v3: se juega sobre la pantalla, sin lista de opciones. Las salidas que no
    // eran botones —avisar a Soporte TI, cerrar la página falsa— pasaron a
    // serlo: un marcador del navegador y la ✕ de la pestaña.
    // v4: el marcador abre la intranet de verdad en vez de saltar al veredicto,
    // para que el camino acertado se vea y no solo se cuente.
    // v5: el briefing enseña los datos prestados en una tarjeta.
    // v6: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v7: las páginas del escenario llevan cabecera y pie de sitio, la
    // falsa igual que la real (prueba del issue #25).
    // v8: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 8,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "phishing/rol-de-pagos",
    Component: lazy(() => import("../secciones/phishing/ClaveCaducada")),
  },
  {
    seccionId: "phishing",
    escenarioId: "rol-de-pagos",
    titulo: "Rol de pagos disponible",
    descripcion:
      "Talento Humano notifica que el rol del mes ya está publicado en el portal.",
    // v3: el escenario se juega en un navegador con pestañas — el
    // participante actúa directo sobre el correo y el portal en vez de
    // elegir de una lista de opciones. Las corridas de versiones distintas
    // no son comparables entre sí.
    // v4: el briefing enseña los datos prestados en una tarjeta.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    // v7: responder o reenviar un correo real deja de leerse como un
    // reproche; sigue siendo parcial porque el mensaje pedía algo.
    // v8: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 8,
    naturaleza: "legitimo",
    dificultad: 3,
    espeja: "phishing/clave-caducada",
    Component: lazy(() => import("../secciones/phishing/RolDePagos")),
  },
  {
    // Sustituye a cobro-dirigido (paquete en aduana): los dos eran "paga poco
    // para recibir algo", así que juntos repetían la lección en vez de
    // ampliarla. Su .tsx sigue en el repositorio por si se quiere recuperar.
    //
    // Dificultad 1: es la puerta de entrada del módulo. La señal decisiva no
    // está en la pantalla —se responde con "¿yo jugué?"— y eso la vuelve
    // accesible para quien nunca ha mirado un dominio en su vida.
    seccionId: "phishing",
    escenarioId: "loteria-premiada",
    titulo: "Premio de lotería",
    descripcion:
      "Un correo anuncia un premio millonario y pide un pago para poder liberarlo.",
    // v2: se juega sobre la pantalla, sin lista de opciones.
    // v3: el participante ve su cédula y su cuenta antes de empezar.
    // v4: el briefing enseña los datos prestados en una tarjeta.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    version: 6,
    naturaleza: "fraude",
    dificultad: 1,
    espeja: "phishing/aviso-filtracion",
    Component: lazy(() => import("../secciones/phishing/LoteriaPremiada")),
  },
  {
    seccionId: "phishing",
    escenarioId: "quishing-actualice",
    titulo: "Código para actualizar datos",
    descripcion:
      "El banco pide escanear un código QR para no perder el acceso a la cuenta.",
    // v3: el escenario se juega en un navegador con pestañas; el QR es el
    // punto interactivo (no hay "vista previa" posible, así que escanear ya
    // abre la página falsa). Las corridas de versiones distintas no son
    // comparables entre sí.
    // v4: el briefing enseña los datos prestados en una tarjeta.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    // v7: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 7,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "phishing/aviso-filtracion",
    Component: lazy(() => import("../secciones/phishing/QuishingActualice")),
  },
  {
    seccionId: "phishing",
    escenarioId: "secuestro-hilo",
    titulo: "Cambio de cuenta bancaria",
    descripcion:
      "La secretaría del colegio informa una cuenta nueva para el pago de la pensión.",
    // v3: se juega sobre la pantalla, sin lista de opciones.
    // v4: la transferencia sale de la cuenta que enseña el briefing.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    version: 6,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "phishing/rol-de-pagos",
    Component: lazy(() => import("../secciones/phishing/SecuestroHilo")),
  },
  {
    // El más difícil del módulo: la redacción es impecable y el anzuelo está en
    // el dominio y en pedir el OTP fuera de la app. Espeja con aviso-filtracion,
    // que es la misma forma —una alerta de seguridad— pero verdadera.
    //
    // v3: el escenario se juega en un navegador con pestañas; pasar de la
    // página de clave al OTP es la misma pestaña avanzando un paso, como en
    // un kit de phishing real. Las corridas de versiones distintas no son
    // comparables entre sí.
    seccionId: "phishing",
    escenarioId: "sesion-bogota",
    titulo: "Inicio de sesión desconocido",
    descripcion:
      "Una alerta nocturna avisa de un acceso a tu cuenta desde otra ciudad.",
    // v4: el briefing enseña los datos prestados en una tarjeta.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    // v7: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 7,
    naturaleza: "fraude",
    dificultad: 5,
    espeja: "phishing/aviso-filtracion",
    Component: lazy(() => import("../secciones/phishing/SesionBogota")),
  },
  {
    seccionId: "phishing",
    escenarioId: "aviso-filtracion",
    titulo: "Aviso de filtración de datos",
    descripcion:
      "Una tienda en línea comunica un incidente de seguridad que afecta a tu cuenta.",
    // v3: se juega sobre la pantalla, sin lista de opciones.
    // v4: el briefing enseña los datos prestados en una tarjeta.
    // v5: cerrar una pestaña ya no termina la corrida ni acredita;
    // devuelve al correo, y la decisión es lo que se haga con el mensaje.
    // v6: las páginas del escenario llevan cabecera, aviso y pie de
    // sitio, la falsa igual que la real.
    // v7: responder o reenviar un correo real deja de leerse como un
    // reproche; sigue siendo parcial porque el mensaje pedía algo.
    // v8: el participante ve los datos que este escenario le pide, y los
    // finales nombran lo que se entregó.
    version: 8,
    naturaleza: "legitimo",
    dificultad: 4,
    espeja: "phishing/sesion-bogota",
    Component: lazy(() => import("../secciones/phishing/AvisoFiltracion")),
  },
  {
    // Puerta de entrada del módulo: el único SMS sin enlace ni formulario. La
    // decisión es si contestar, y eso se entiende sin haber mirado nunca una
    // dirección web.
    seccionId: "smishing",
    escenarioId: "baja-suscripcion",
    titulo: "Suscripción que no contrataste",
    descripcion:
      "Un SMS cobra un servicio que nunca pediste y ofrece cancelarlo respondiendo.",
    // v3: las opciones mirar (revisar suscripciones) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el mensaje después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 1,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/BajaSuscripcion")),
  },
  {
    // El más difícil del módulo: el código que llega es auténtico, así que todo
    // lo que los otros enseñan a mirar sale bien en ese mensaje. Lo falso es el
    // que pide reenviarlo.
    seccionId: "smishing",
    escenarioId: "codigo-reenviado",
    titulo: "Código que piden reenviar",
    descripcion:
      "Alguien dice ser del banco y pide el código de verificación que acaba de llegarte.",
    // v3: las opciones mirar (revisar intentos de acceso) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 5,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/CodigoReenviado")),
  },
  {
    seccionId: "smishing",
    escenarioId: "bono-estado",
    titulo: "Bono preseleccionado",
    descripcion:
      "Un SMS anuncia una ayuda económica y pide registrar la cuenta antes de un plazo.",
    // v3: las opciones mirar (elegir portal oficial) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el mensaje después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/BonoEstado")),
  },
  {
    // El único del módulo cuyo anzuelo no es una dirección sino un número de
    // teléfono. Tiende el puente hacia vishing: el engaño se termina de contar
    // dentro de la llamada.
    seccionId: "smishing",
    escenarioId: "tarjeta-bloqueada",
    titulo: "Tarjeta bloqueada",
    descripcion:
      "Un SMS avisa de un bloqueo y da un número al que llamar para reactivar.",
    // v3: las opciones mirar (revisar tarjetas) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el mensaje después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/TarjetaBloqueada")),
  },
  {
    seccionId: "smishing",
    escenarioId: "citacion-transito",
    titulo: "Citación de tránsito",
    descripcion:
      "Un SMS amenaza con duplicar una multa si no pagas desde el enlace enviado.",
    // v3: las opciones mirar (elegir portal oficial) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el mensaje después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/CitacionTransito")),
  },
  {
    seccionId: "smishing",
    escenarioId: "paquete-retenido",
    titulo: "Paquete retenido",
    descripcion:
      "Un mensaje pide un pago pequeño para liberar un envío que sí estás esperando.",
    // v3: las opciones mirar (rastrear guía) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el mensaje después de verificar (issue #74).
    version: 3,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "smishing/alerta-consumo",
    Component: lazy(() => import("../secciones/smishing/PaqueteRetenido")),
  },
  {
    seccionId: "smishing",
    escenarioId: "alerta-consumo",
    titulo: "Alerta de consumo",
    descripcion:
      "Una notificación de tu banco informa un consumo hecho con tu tarjeta.",
    // v3: las opciones mirar (ver movimientos) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el aviso después de verificar (issue #74).
    version: 3,
    naturaleza: "legitimo",
    dificultad: 3,
    espeja: "smishing/citacion-transito",
    Component: lazy(() => import("../secciones/smishing/AlertaConsumo")),
  },
  {
    // El segundo legítimo, y el que cierra el módulo: mismo courier y mismo
    // envío que paquete-retenido, contados por quien de verdad los maneja.
    seccionId: "smishing",
    escenarioId: "entrega-programada",
    titulo: "Entrega programada",
    descripcion:
      "El courier avisa la entrega de tu paquete para mañana, sin pedirte nada.",
    // v3: las opciones mirar (ver detalle) ya no acreditan al cerrar
    // la pantalla; el acierto se gana solo al dejar el aviso después de verificar (issue #74).
    version: 3,
    naturaleza: "legitimo",
    dificultad: 2,
    espeja: "smishing/paquete-retenido",
    Component: lazy(() => import("../secciones/smishing/EntregaProgramada")),
  },
  {
    // La puerta de entrada del módulo, y la única señal que no está en la
    // pantalla: se responde con "¿yo participé?". Espeja con entrega-courier,
    // que es la otra llamada de alguien que dice traerte algo — solo que esa
    // es verdad.
    seccionId: "vishing",
    escenarioId: "premio-sorteo",
    titulo: "Premio de un sorteo",
    descripcion:
      "Una llamada anuncia que ganaste un electrodoméstico y pide cubrir la entrega.",
    // v1 del módulo inmersivo: la llamada se juega sobre el teléfono —contestar,
    // colgar, salir a comprobar en otra app— en vez de con una lista de
    // opciones al lado. Sustituye a llamada-antiestafas, que nunca llegó a
    // estar activa y por eso no deja corridas huérfanas.
    version: 1,
    naturaleza: "fraude",
    dificultad: 1,
    espeja: "vishing/entrega-courier",
    Component: lazy(() => import("../secciones/vishing/PremioSorteo")),
  },
  {
    // El único que no empieza con el teléfono sonando: la llamada ya pasó y lo
    // que queda es el registro. La decisión —marcar o no— la toma el
    // participante sin nadie apurándole, que es lo que lo hace distinto.
    seccionId: "vishing",
    escenarioId: "llamada-perdida",
    titulo: "Llamada perdida de madrugada",
    descripcion:
      "Un número extranjero llamó a las 03:12 y colgó al primer timbre.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "vishing/entrega-courier",
    Component: lazy(() => import("../secciones/vishing/LlamadaPerdida")),
  },
  {
    // El primer legítimo, y el más sencillo: nadie pide nada. Mide dónde está
    // el límite, no cuánto se desconfía — atender la entrega está bien, dictar
    // la tarjeta no, aunque quien llame sea de verdad.
    seccionId: "vishing",
    escenarioId: "entrega-courier",
    titulo: "Entrega en la puerta",
    descripcion:
      "Un repartidor llama desde abajo con el paquete que estabas esperando.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 2,
    espeja: "vishing/premio-sorteo",
    Component: lazy(() => import("../secciones/vishing/EntregaCourier")),
  },
  {
    seccionId: "vishing",
    escenarioId: "devolucion-sri",
    titulo: "Devolución de impuestos",
    descripcion:
      "Una llamada institucional ofrece acreditarte dinero a favor y pide confirmar datos.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "vishing/banco-confirma",
    Component: lazy(() => import("../secciones/vishing/DevolucionSri")),
  },
  {
    // No pide dinero ni códigos: pide permiso. Toda la estafa cabe en un botón
    // que dice "Permitir", y por eso el escenario obliga a pasar por la
    // pantalla que lo explica.
    seccionId: "vishing",
    escenarioId: "soporte-tecnico",
    titulo: "Soporte técnico del internet",
    descripcion:
      "Un técnico avisa de que tu router está infectado y se ofrece a limpiarlo.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "vishing/banco-confirma",
    Component: lazy(() => import("../secciones/vishing/SoporteTecnico")),
  },
  {
    // La pareja de tarjeta-bloqueada, al revés: allí el SMS empujaba a llamar;
    // aquí la llamada empuja a leer un SMS que sí es del banco.
    seccionId: "vishing",
    escenarioId: "antifraude-banco",
    titulo: "Aviso de consumo por teléfono",
    descripcion:
      "Quien llama dice ser del banco y quiere anular un consumo que no reconoces.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "vishing/banco-confirma",
    Component: lazy(() => import("../secciones/vishing/AntifraudeBanco")),
  },
  {
    // El segundo legítimo, y el que da sentido al módulo: mismo consumo y mismo
    // código que antifraude-banco, contados por quien de verdad los maneja. Sin
    // él el módulo enseñaría "cuelga siempre", que es miedo y no criterio.
    seccionId: "vishing",
    escenarioId: "banco-confirma",
    titulo: "Consumo retenido",
    descripcion:
      "El banco pregunta si una compra grande hecha con tu tarjeta es tuya.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 4,
    espeja: "vishing/antifraude-banco",
    Component: lazy(() => import("../secciones/vishing/BancoConfirma")),
  },
  {
    // El más difícil: no hay urgencia, ni amenaza, ni dinero, ni claves. Solo
    // preguntas que parecen inofensivas y son las de seguridad del banco.
    seccionId: "vishing",
    escenarioId: "encuesta-datos",
    titulo: "Encuesta de satisfacción",
    descripcion:
      "Una encuesta amable del banco hace preguntas para validar que eres el titular.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 5,
    espeja: "vishing/banco-confirma",
    Component: lazy(() => import("../secciones/vishing/EncuestaDatos")),
  },
  {
    // La puerta de entrada del módulo y el fraude más común del país: el
    // número nuevo que dice ser de alguien de tu familia. Espeja con
    // numero-nuevo-real, que es exactamente el mismo mensaje siendo verdad.
    seccionId: "suplantacion",
    escenarioId: "cambio-numero",
    titulo: "Cambio de número",
    descripcion:
      "Un número desconocido dice ser un familiar tuyo que perdió el celular.",
    // v2: el escenario se juega sobre el teléfono —chat, perfil del contacto,
    // agenda y app del banco— en vez de con una lista de opciones, y la nota
    // de voz suena de verdad. Las corridas de la v1 no son comparables: nadie
    // llegó a jugarla, porque el escenario nunca estuvo activo.
    version: 2,
    naturaleza: "fraude",
    dificultad: 1,
    espeja: "suplantacion/numero-nuevo-real",
    Component: lazy(() => import("../secciones/suplantacion/CambioNumero")),
  },
  {
    seccionId: "suplantacion",
    escenarioId: "perfil-clonado",
    titulo: "Perfil clonado",
    descripcion:
      "Una amiga escribe desde una cuenta nueva y termina pidiendo dinero prestado.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "suplantacion/clonaron-tu-perfil",
    Component: lazy(() => import("../secciones/suplantacion/PerfilClonado")),
  },
  {
    // El primer legítimo, y el único del proyecto donde el ataque no va
    // dirigido al participante sino que se hace *con* su identidad. Mide qué
    // hace, no si reconoce algo.
    seccionId: "suplantacion",
    escenarioId: "clonaron-tu-perfil",
    titulo: "Alguien usa tu nombre",
    descripcion:
      "Una amiga avisa de que hay una cuenta con tus fotos pidiendo dinero.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 2,
    espeja: "suplantacion/perfil-clonado",
    Component: lazy(() => import("../secciones/suplantacion/ClonaronTuPerfil")),
  },
  {
    // La suplantación en el trabajo, que no se apoya en la tecnología sino en
    // la jerarquía: a la gerencia no se le pregunta dos veces.
    seccionId: "suplantacion",
    escenarioId: "jefe-urgente",
    titulo: "Encargo de la gerencia",
    descripcion:
      "Tu jefa escribe desde otro número y pide comprar tarjetas de regalo.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "suplantacion/numero-nuevo-real",
    Component: lazy(() => import("../secciones/suplantacion/JefeUrgente")),
  },
  {
    // El segundo legítimo: el mismo mensaje de cambio-numero, esta vez cierto.
    // Sin él el módulo enseñaría "desconfía de todo número nuevo", que no es
    // criterio sino miedo. Y aun siendo auténtico, mide qué se acaba mandando.
    seccionId: "suplantacion",
    escenarioId: "numero-nuevo-real",
    titulo: "Número nuevo de la familia",
    descripcion:
      "Tu tía avisa desde otro número que perdió el celular, con una nota de voz.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 3,
    espeja: "suplantacion/cambio-numero",
    Component: lazy(() => import("../secciones/suplantacion/NumeroNuevoReal")),
  },
  {
    // Aquí no está en juego el dinero sino la cuenta del propio participante,
    // y el favor que piden parece diminuto.
    seccionId: "suplantacion",
    escenarioId: "codigo-prestado",
    titulo: "Código pedido por un familiar",
    descripcion:
      "Tu prima pide que le pases un código de seis dígitos que te llegó por error.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "suplantacion/numero-nuevo-real",
    Component: lazy(() => import("../secciones/suplantacion/CodigoPrestado")),
  },
  {
    // La cuenta es auténtica y quien escribe no: todo lo que enseñan los otros
    // escenarios —número guardado, foto, historial— sale bien aquí.
    seccionId: "suplantacion",
    escenarioId: "cuenta-hackeada",
    titulo: "Un amigo pide prestado",
    descripcion:
      "Un amigo escribe desde su chat de siempre pidiendo dinero por una urgencia.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "suplantacion/clonaron-tu-perfil",
    Component: lazy(() => import("../secciones/suplantacion/CuentaHackeada")),
  },
  {
    // El más difícil del proyecto entero: la voz es la suya, y contra eso no
    // sirve nada de lo que enseñan los demás. Solo funciona colgar y marcar.
    seccionId: "suplantacion",
    escenarioId: "voz-clonada",
    titulo: "La voz de un familiar",
    descripcion:
      "Una llamada trae la voz de tu hija diciendo que tuvo un accidente.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 5,
    espeja: "suplantacion/numero-nuevo-real",
    Component: lazy(() => import("../secciones/suplantacion/VozClonada")),
  },
  {
    // La puerta de entrada del módulo. La señal decisiva no está en el mensaje
    // sino en la propia app del banco del participante, en dos líneas que casi
    // nadie distingue: saldo contable y saldo disponible.
    seccionId: "estafa",
    escenarioId: "saldo-contable",
    titulo: "Saldo contable",
    descripcion:
      "Vendes una laptop y el comprador manda un comprobante de depósito pidiendo que despaches ya.",
    // v2: se juega sobre la pantalla, sin lista de opciones. El comprobante
    // pasó de contarse en texto a dibujarse como la captura que es.
    version: 2,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "estafa/pago-lavadora",
    Component: lazy(() => import("../secciones/estafa/SaldoContable")),
  },
  {
    // El lado del comprador. Cuando el que arriesga eres tú, el precio bajo
    // deja de leerse como alarma y pasa a sentirse como suerte.
    seccionId: "estafa",
    escenarioId: "mitad-de-precio",
    titulo: "Celular a mitad de precio",
    descripcion:
      "Un celular a mitad de precio, pero solo se paga por adelantado y sin verlo.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 2,
    espeja: "estafa/pago-lavadora",
    Component: lazy(() => import("../secciones/estafa/MitadDePrecio")),
  },
  {
    // El primero de los dos legítimos. Espeja a saldo-contable con la misma
    // escena y las señales al revés: un módulo que solo enseña fraudes enseña
    // a desconfiar de todo, y eso también hace daño.
    //
    // Ni el título ni el id dicen que sea el bueno, y va tercero y no último:
    // un legítimo que se anuncia deja de medir nada, y dos legítimos seguidos
    // al final del menú se reconocen por su posición.
    seccionId: "estafa",
    escenarioId: "pago-lavadora",
    titulo: "Pago por la lavadora",
    descripcion:
      "Vendes una lavadora y la compradora dice que ya te transfirió.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 3,
    espeja: "estafa/saldo-contable",
    Component: lazy(() => import("../secciones/estafa/PagoLavadora")),
  },
  {
    seccionId: "estafa",
    escenarioId: "arriendo-anticipado",
    titulo: "Departamento en arriendo",
    descripcion:
      "Un departamento barato cuya garantía hay que depositar antes de poder verlo.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "estafa/visita-departamento",
    Component: lazy(() => import("../secciones/estafa/ArriendoAnticipado")),
  },
  {
    // El único del proyecto donde el dinero entra de verdad antes de perderse:
    // lo que se pierde es lo que devuelves tú.
    seccionId: "estafa",
    escenarioId: "vuelto-de-mas",
    titulo: "Un pago de más",
    descripcion:
      'Un comprador te transfiere de más "por error" y pide que le devuelvas la diferencia.',
    version: 1,
    naturaleza: "fraude",
    dificultad: 3,
    espeja: "estafa/pago-lavadora",
    Component: lazy(() => import("../secciones/estafa/VueltoDeMas")),
  },
  {
    // El segundo legítimo: el mismo trato de arriendo-anticipado con el orden
    // puesto del derecho (ver, firmar, pagar). Va sexto, separado del otro
    // legítimo y con dos fraudes detrás.
    seccionId: "estafa",
    escenarioId: "visita-departamento",
    titulo: "Visita al departamento",
    descripcion:
      "Una agente inmobiliaria te da la dirección y tres horarios para ver un departamento.",
    version: 1,
    naturaleza: "legitimo",
    dificultad: 2,
    espeja: "estafa/arriendo-anticipado",
    Component: lazy(() => import("../secciones/estafa/VisitaDepartamento")),
  },
  {
    // El más difícil: el primer retiro sí llega, y esa es toda la inversión
    // que hace el estafador.
    seccionId: "estafa",
    escenarioId: "ganancia-garantizada",
    titulo: "Ganancia garantizada",
    descripcion:
      "Una plataforma garantiza 30% mensual, y tu primer retiro pequeño sí llegó.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "estafa/visita-departamento",
    Component: lazy(() => import("../secciones/estafa/GananciaGarantizada")),
  },
  {
    // La misma vuelta de tuerca que ganancia-garantizada, pero entra por la
    // falta de trabajo y no por los ahorros: toca a otra gente.
    seccionId: "estafa",
    escenarioId: "tareas-pagadas",
    titulo: "Trabajo desde casa",
    descripcion:
      "Un trabajo desde casa que sí te pagó las primeras tareas y ahora pide un depósito.",
    version: 1,
    naturaleza: "fraude",
    dificultad: 4,
    espeja: "estafa/pago-lavadora",
    Component: lazy(() => import("../secciones/estafa/TareasPagadas")),
  },
  // La última amenaza queda fuera del MVP ampliado. Sus componentes
  // .tsx siguen en el repositorio intactos: se reactivan descomentando la
  // entrada correspondiente. Las secciones se quedan declaradas en SECCIONES
  // arriba; Dashboard.tsx ya pinta "Pronto" cuando escenariosDeSeccion() da
  // vacío, así que no hace falta tocar nada más.

  {
    seccionId: 'fisico',
    escenarioId: 'salida-segura',
    titulo: 'Fin de jornada segura',
    descripcion:
      'Debes proteger tu escritorio y computadora antes de irte de la oficina al final del día.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/SalidaSegura')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'trampa-usb',
    titulo: 'USB abandonado',
    descripcion:
      'Encuentras un USB anónimo en una zona común con una etiqueta que atrae la atención.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/TrampaUSB')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'cable-comprometido',
    titulo: 'Cable sospechoso',
    descripcion:
      'Un cable USB desconocido está conectado en un punto de carga compartido de la oficina.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/CableComprometido')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'tarjeta-clonada',
    titulo: 'Billetera clonada',
    descripcion:
      'Tu billetera fue clonada en la calle: alguien la escaneó o accedió sin que lo notaras. Debes decidir cómo guardarla y qué hacer cuando descubres el fraude.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/TarjetaClonada')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'descarga-programas-piratas',
    titulo: 'Descarga de software pirata',
    descripcion:
      'Un compañero te ofrece una versión gratis de un software profesional caro. Debes elegir de dónde descargarlo.',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 3,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/DescargaProgramasPiratas')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'puertos-frios-datacenter',
    titulo: 'Puerto frío abierto en datacenter',
    descripcion:
      'La puerta del puerto frío está abierta. Debes actuar rápido para evitar que equipos críticos se vean afectados por el calor.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 3,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/PuertosFriosColdAisle')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'privacidad-claves',
    titulo: 'Privacidad en el escritorio compartido',
    descripcion:
      'Un compañero se acerca a tu escritorio mientras trabajas. Debes proteger tu información sensible sin ser obvio.',
    version: 1,
    naturaleza: 'legitimo',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/PrivacidadClaves')),
  },
  {
    seccionId: 'fisico',
    escenarioId: 'qr-cafe-wifi',
    titulo: 'Código QR en café',
    descripcion:
      'En un café ves un código QR en la pared que promete WiFi gratis. ¿Es seguro escanearlo?',
    version: 1,
    naturaleza: 'fraude',
    dificultad: 2,
    espeja: null,
    Component: lazy(() => import('../secciones/fisico/CodigoQRCafe')),
  },
];

// El id "<seccion>/<escenario>" es la clave que se guarda en la base: no puede
// cambiar una vez que un escenario tenga corridas registradas.
export const ESCENARIOS: Escenario[] = BASE.map((escenario) => ({
  ...escenario,
  id: `${escenario.seccionId}/${escenario.escenarioId}`,
}));

export function getSeccion(seccionId: string | undefined): Seccion | undefined {
  return SECCIONES.find((seccion) => seccion.id === seccionId);
}

export function escenariosDeSeccion(seccionId: string): Escenario[] {
  return ESCENARIOS.filter((escenario) => escenario.seccionId === seccionId);
}

export function getEscenario(id: string): Escenario | undefined {
  return ESCENARIOS.find((escenario) => escenario.id === id);
}
