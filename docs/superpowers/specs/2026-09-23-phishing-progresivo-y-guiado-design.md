# Phishing progresivo con inicio guiado

**Fecha:** 2026-09-23  
**Proyecto:** SAFE Web  
**Estado:** diseño aprobado; pendiente de plan e implementación

El módulo de phishing mantendrá un recorrido de menor a mayor dificultad con
tres casos fáciles, tres medios y dos difíciles, pero
reducirá ligeramente la carga inicial para quienes aún no saben qué observar.
ESC-01 enseñará el método de inspección antes de pedir una decisión. Los otros
siete escenarios harán una señal relevante un poco más reconocible, sin
etiquetar el caso como fraude ni convertir la respuesta en algo evidente.

## Resultado esperado

Una persona que abre el módulo por primera vez aprende en ESC-01 a revisar una
señal, contrastarla y decidir con calma. En ESC-02 a ESC-08 aplica ese mismo
criterio con ayuda opcional y con al menos una señal que debe descubrir por sí
misma.

No cambia el contenido de otros módulos, los criterios de aprobación, el
registro de corridas, ni la naturaleza (fraude o legítimo) de ningún escenario.

## Recorrido del participante

1. Abre el módulo Phishing y ve los ocho casos en dificultad ascendente.
2. En ESC-01, recibe una guía breve que propone revisar señales concretas antes
   de responder; la guía explica qué verificar, no cuál opción elegir.
3. En los casos restantes, una señal decisiva es algo más perceptible y la
   pista opcional conserva el apoyo si la persona se bloquea.
4. Tras responder, el veredicto sigue explicando las señales y permite
   relacionar lo aprendido con el siguiente caso.

## Decisiones de diseño

| Tema | Decisión |
|---|---|
| Alcance | Solo los ocho escenarios de `phishing`. No se modifica smishing, vishing, suplantación, estafa, riesgo físico ni asistentes de IA. |
| Orden | Se conserva el orden de los ocho casos y se ajustan sus niveles a `1, 2, 2, 3, 3, 3, 4, 5`: tres fáciles, tres medios y dos difíciles. La implementación debe protegerlo con pruebas. |
| ESC-01 guiado | `loteria-premiada` incorpora una orientación previa a la decisión. Invita a comprobar si el premio era esperable, el pago anticipado y el remitente/enlace; no llama al correo “fraude” ni resalta la opción correcta. |
| Ayuda posterior | Las pistas expandibles y el panel de veredicto continúan siendo opcionales y posteriores a la interacción principal. La nueva guía de ESC-01 complementa, no sustituye, esos mecanismos. |
| Dificultad | En cada escenario de phishing posterior a ESC-01 se suaviza una única señal decisiva. Permanecen otras señales y decisiones ambiguas suficientes para exigir observación. |
| Casos legítimos | `rol-de-pagos` y `aviso-filtracion` siguen pareciendo plausibles. La mejora nunca debe usar un estilo torpe, una urgencia artificial o una marca que haga parecer falso un caso legítimo. |

## Ajustes de guion por escenario

Los cambios concretos deben conservar la intención de cada escenario y subir su
versión de catálogo para distinguir las corridas de la redacción anterior.

| Escenario | Dificultad | Ajuste gradual permitido |
|---|---:|---|
| ESC-01 `loteria-premiada` | 1 | Guía previa con tres comprobaciones: expectativa del premio, pago previo y remitente o enlace. La historia mantiene la elección libre. |
| ESC-02 `factura-sri` | 2 | Hacer más visible la inconsistencia entre la urgencia y el canal de verificación, sin revelar que la factura es falsa. |
| ESC-03 `clave-caducada` | 2 | Reforzar discretamente la señal de dominio o de enlace y conservar la presión de tiempo como elemento que la persona debe interpretar. |
| ESC-04 `rol-de-pagos` | 3 | Mantener el aviso legítimo y ofrecer una ruta de verificación reconocible; no introducir señales propias de una estafa. |
| ESC-05 `quishing-actualice` | 3 | Hacer más reconocible la petición inusual de escanear el QR, sin afirmar que todo QR es peligroso ni eliminar la decisión. |
| ESC-06 `secuestro-hilo` | 3 | Dar un indicio ligeramente más claro de que el cambio de cuenta exige confirmación por otro canal; el hilo sigue siendo verosímil. |
| ESC-07 `aviso-filtracion` | 4 | Mantenerlo legítimo y hacer más clara la alternativa segura de entrar por el canal habitual; no presentar la alerta como irrelevante. |
| ESC-08 `sesion-bogota` | 5 | Conservar la complejidad de la cadena clave/OTP, pero hacer un poco más visible que no se debe entregar un OTP fuera de la aplicación oficial. |

Estas son direcciones de contenido, no textos finales obligatorios. Cada guion
debe seguir pareciendo una situación cotidiana y evitar errores caricaturescos,
por ejemplo faltas de ortografía intencionales, colores de advertencia
permanentes o etiquetas que revelen el veredicto.

## Diseño técnico

La fuente de verdad del orden y de la dificultad seguirá siendo
`frontend/src/data/catalogo.ts`. `getSectionScenarios()` ya preserva el orden
de declaración y `Seccion` lo usa tanto para las tarjetas ESC-01…ESC-08 como
para el desbloqueo secuencial. No se agregará una segunda regla de orden ni se
cambiarán identificadores o rutas públicas.

La guía específica de ESC-01 se implementará en
`frontend/src/secciones/phishing/LoteriaPremiada.tsx`, reutilizando la
presentación de instrucciones existente cuando alcance. Solo se extraerá una
capacidad compartida en `StoryEscenario` o `Instrucciones` si el componente no
puede expresar una orientación previa sin duplicar comportamiento o romper su
accesibilidad.

Los demás ajustes permanecen en los guiones de sus propios componentes de
phishing. No se cambia la estructura de las corridas, el API ni el bloqueo del
módulo.

## Límites y protección de la dificultad

- Nunca mostrar una etiqueta como “trampa”, “fraude” o “respuesta correcta”
  antes de la decisión.
- No preseleccionar ni deshabilitar opciones para conducir a la respuesta.
- No reducir la cantidad de pasos de ESC-08 ni reemplazar la decisión por una
  confirmación pasiva.
- Conservar la comparación pedagógica entre casos fraudulentos y legítimos.
- Aplicar solo un ajuste de claridad por escenario; si el guion ya ofrece una
  señal suficientemente visible, conservarlo y ajustar la pista o el contexto
  en vez de sumar avisos.

## Pruebas y aceptación

- [ ] El catálogo contiene exactamente ocho escenarios de phishing, en el
  orden actual y con dificultades `1, 2, 2, 3, 3, 3, 4, 5`.
- [ ] La tarjeta ESC-01 inicia `loteria-premiada`, y ESC-02 continúa
  bloqueado hasta completar ESC-01.
- [ ] ESC-01 muestra la orientación previa y conserva una decisión no
  revelada; la guía no contiene el veredicto ni la respuesta correcta.
- [ ] Cada escenario de phishing conserva su identificador, ruta, naturaleza
  y flujo de registro de corrida.
- [ ] Los dos escenarios legítimos siguen permitiendo una respuesta legítima
  sin señales que los presenten falsamente como fraude.
- [ ] Las pruebas de catálogo, sección y escenario guiado pasan junto con la
  suite de frontend aplicable.

## Fuera de alcance

- Cambiar el orden de los módulos del recorrido.
- Crear un modo tutorial reutilizable para todos los módulos.
- Alterar umbrales, certificados, puntajes o criterios de desbloqueo.
- Simplificar los escenarios no relacionados con phishing.

## Próximo paso

Revisar esta especificación. Con aprobación explícita, el siguiente paso es
preparar un plan de implementación detallado; no se debe comenzar a editar los
escenarios hasta entonces.
