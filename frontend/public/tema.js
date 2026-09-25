// Pone data-tema antes del primer pintado: si se esperara a que React
// monte, quien eligió oscuro vería un destello blanco en cada carga. Bloqueante a propósito, son microsegundos y es lo único
// que lo garantiza. Ver ThemeContext.tsx y el spec de tema oscuro §4.3.
//
// Va en un archivo y no inline en index.html: la CSP de nginx.conf
// (`script-src 'self'`) bloquea todo <script> inline, y el tema no se aplicaba.
// Tampoco puede ser type="module" para que Vite lo empaquete: los módulos se
// ejecutan diferidos, después del primer pintado.
// Por defecto claro: solo "oscuro" guardado cambia el tema. Un "sistema"
// de la versión anterior cuenta como no elegido.
try {
  if (localStorage.getItem('tema') === 'oscuro') document.documentElement.dataset.tema = 'oscuro'
} catch {}
