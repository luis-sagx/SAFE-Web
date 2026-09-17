/// La trama de seguridad del boleto (las mismas rayas finas que ya usaba el
/// thumbnail de un video sin reproducir, VideoCapacitacion.tsx) puesta detrás
/// de una pantalla completa — nunca una foto de fondo, que rompería con que
/// en toda la app no hay ni una sola fotografía.
///
/// No es un componente que renderiza un elemento: es la clase CSS
/// `trama-fondo` (ver index.css), para agregar directo al contenedor de la
/// pantalla junto con sus demás clases — p. ej.
/// `className={`relative min-h-screen overflow-hidden bg-canvas ${TRAMA_FONDO}`}`.
/// Como background-image del propio contenedor pinta garantizado detrás de
/// TODOS sus hijos, posicionados o no — un <span> superpuesto (la primera
/// versión de esto) no lo garantiza: un hijo sin `relative` se pinta antes
/// que un hermano posicionado sin importar el orden del DOM, y la trama
/// terminaba encima del header, de una tarjeta o del bloc de notas.
export const TRAMA_FONDO = 'trama-fondo'
