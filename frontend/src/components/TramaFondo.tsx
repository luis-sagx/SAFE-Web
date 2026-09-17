/// La trama de seguridad del boleto (las mismas rayas finas que ya usaba el
/// thumbnail de un video sin reproducir, VideoCapacitacion.tsx) puesta detrás
/// de una pantalla completa, nunca una foto de fondo, que rompería con que
/// en toda la app no hay ni una sola fotografía.
///
/// El contenedor que la use necesita `relative overflow-hidden`, y esta debe
/// ser el PRIMER hijo: sin z-index a propósito, para que el orden del DOM
/// (que pinta primero lo que aparece antes) la deje detrás de todo lo demás.
/// Un z-index negativo aquí puede hundirla detrás del propio fondo opaco del
/// contenedor según cómo apile el navegador, ver AuthLayout.tsx, donde ya
/// costó encontrar el porqué.
///
/// Además, como esta es `position: absolute`, el navegador la pinta en la
/// capa de "elementos posicionados", que siempre se pinta DESPUÉS de los
/// hijos normales sin posición (aunque vayan antes en el DOM). Por eso un
/// hermano opaco como el header necesita también `relative` (o cualquier
/// posición): solo así entra a la misma capa y el orden del DOM vuelve a
/// decidir quién queda encima. Sin eso, la trama se pinta ENCIMA del header
/// aunque esté primera en el JSX, así se veía en AppHeader antes de este
/// ajuste.
function TramaFondo() {
  return <span aria-hidden className="trama-boleto pointer-events-none absolute inset-0 opacity-20" />
}

export default TramaFondo
