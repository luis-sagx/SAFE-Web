import { AtSign, CreditCard, FileText, IdCard, KeyRound, Mail } from 'lucide-react'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'

/** Qué datos prestados necesita ver el participante antes de entrar. El correo
 *  va siempre; los demás solo donde el escenario los pide, porque una cuenta
 *  bancaria en un escenario donde no aparece dinero es ruido. */
export type DatoIdentidad = 'cedula' | 'ruc' | 'usuario' | 'clave' | 'cuenta' | 'tarjeta'

/**
 * Los datos que el participante "tiene" dentro del escenario, antes de empezar.
 *
 * Sin esto, un formulario falso que pide la cédula y el número de cuenta se lee
 * como dos casillas vacías, y rellenarlas no se siente como entregar nada. La
 * tarjeta convierte esos campos en algo propio: cuando el final dice que
 * entregaste tu cuenta, es una cuenta que ya habías visto.
 *
 * Se muestra, no se pide: en ningún momento del entrenamiento se le solicita a
 * nadie su documento real (issue #7).
 */
function TarjetaIdentidad({ correo, datos }: { correo: string; datos: DatoIdentidad[] }) {
  const filas = [
    { clave: 'correo', Icono: Mail, etiqueta: 'Correo', valor: correo },
    { clave: 'cedula', Icono: IdCard, etiqueta: 'Cédula', valor: IDENTIDAD_FICTICIA.cedula },
    // Se saca del correo, que es de donde sale también dentro del escenario.
    // Va como fila propia porque deducirlo quitándole el dominio al correo es
    // un salto que este público no tiene por qué dar.
    { clave: 'usuario', Icono: AtSign, etiqueta: 'Usuario', valor: correo.split('@')[0] ?? correo },
    { clave: 'ruc', Icono: FileText, etiqueta: 'RUC', valor: IDENTIDAD_FICTICIA.ruc },
    { clave: 'cuenta', Icono: CreditCard, etiqueta: 'Cuenta bancaria', valor: CUENTA_FICTICIA },
    {
      clave: 'tarjeta',
      Icono: CreditCard,
      etiqueta: 'Tarjeta',
      valor: `${IDENTIDAD_FICTICIA.banco} · terminada en ${IDENTIDAD_FICTICIA.tarjeta}`,
    },
    // La contraseña va al final: es el dato que más pesa cuando se pierde, y
    // el único que un formulario de verdad no enseña. En pantalla los campos
    // la siguen tapando con puntos, como haría cualquier sitio; esto es lo que
    // esos puntos significan.
    { clave: 'clave', Icono: KeyRound, etiqueta: 'Contraseña', valor: IDENTIDAD_FICTICIA.clave },
  ].filter((fila) => fila.clave === 'correo' || datos.includes(fila.clave as DatoIdentidad))

  return (
    <section
      className="rounded-lg border border-hairline-strong bg-canvas-soft p-5"
      aria-label="Tus datos en este escenario"
    >
      <h2 className="text-base font-semibold text-ink">Tus datos en este escenario</h2>
      <p className="mt-1 text-base leading-relaxed text-body">
        Son inventados y no existen fuera de este entrenamiento. Te los enseñamos para que
        reconozcas lo que estarías entregando si un formulario te los pide. Los campos que piden la
        contraseña la taparán con puntos, como en cualquier sitio: esta es la que esconden.
      </p>

      <dl className="mt-4 grid gap-3">
        {filas.map(({ clave, Icono, etiqueta, valor }) => (
          <div key={clave} className="flex items-start gap-3">
            <Icono aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} />
            <div>
              <dt className="text-sm font-medium text-muted">{etiqueta}</dt>
              {/* Monoespaciada: son números que hay que reconocer luego, dígito
                  a dígito, dentro de un formulario. */}
              <dd className="font-mono text-base text-ink">{valor}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default TarjetaIdentidad
