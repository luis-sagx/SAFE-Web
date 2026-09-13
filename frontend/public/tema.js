// Pone data-tema antes del primer pintado: si se esperara a que React
// monte, alguien con el sistema en oscuro vería un destello blanco en
// cada carga. Bloqueante a propósito — son microsegundos y es lo único
// que lo garantiza. Ver ThemeContext.tsx y el spec de tema oscuro §4.3.
//
// Va en un archivo y no inline en index.html: la CSP de nginx.conf
// (`script-src 'self'`) bloquea todo <script> inline, y el tema no se aplicaba.
// Tampoco puede ser type="module" para que Vite lo empaquete: los módulos se
// ejecutan diferidos, después del primer pintado.
try {
  var preference = localStorage.getItem('tema') || 'sistema'
  var isDark =
    preference === 'oscuro' || (preference === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) document.documentElement.dataset.tema = 'oscuro'
} catch {}
