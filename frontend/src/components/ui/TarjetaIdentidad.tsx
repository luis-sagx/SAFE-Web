import { AtSign, CreditCard, FileText, IdCard, KeyRound, Mail } from 'lucide-react'
import Ticket from '../Boleto'
import { ACCOUNT_FAKE, IDENTITY_FAKE } from '../../lib/identidadFicticia'

// El correo va siempre; los demás datos solo donde el escenario los pide.
export type IdentityData = 'cedula' | 'ruc' | 'usuario' | 'clave' | 'cuenta' | 'tarjeta'

// Se muestra, no se pide: nunca se solicita el documento real de nadie (issue #7).
function IdentityCard({ correo: email, datos: data }: { correo: string; datos: IdentityData[] }) {
  const rows = [
    { clave: 'correo', Icono: Mail, etiqueta: 'Correo', valor: email },
    { clave: 'cedula', Icono: IdCard, etiqueta: 'Cédula', valor: IDENTITY_FAKE.cedula },
    // Fila propia: deducir el usuario quitándole el dominio al correo es un salto que no todos dan.
    { clave: 'usuario', Icono: AtSign, etiqueta: 'Usuario', valor: email.split('@')[0] ?? email },
    { clave: 'ruc', Icono: FileText, etiqueta: 'RUC', valor: IDENTITY_FAKE.ruc },
    { clave: 'cuenta', Icono: CreditCard, etiqueta: 'Cuenta bancaria', valor: ACCOUNT_FAKE },
    {
      clave: 'tarjeta',
      Icono: CreditCard,
      etiqueta: 'Tarjeta',
      valor: `${IDENTITY_FAKE.banco} · terminada en ${IDENTITY_FAKE.tarjeta}`,
    },
    // Al final: es el único dato que un formulario real no enseña destapado.
    { clave: 'clave', Icono: KeyRound, etiqueta: 'Contraseña', valor: IDENTITY_FAKE.clave },
  ].filter((row) => row.clave === 'correo' || data.includes(row.clave as IdentityData))

  return (
    // El boleto no reenvía atributos: la región y su rótulo viven en el <section>.
    <section aria-label="Tus datos en este escenario">
      <Ticket className="p-6">
        <h2 className="font-display text-xl uppercase tracking-[0.02em] text-ink">
          Tus datos en este escenario
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body">
          Son inventados y no existen fuera de este entrenamiento. Te los enseñamos para que
          reconozcas lo que estarías entregando si un formulario te los pide. Los campos que piden
          la contraseña la taparán con puntos, como en cualquier sitio: esta es la que esconden.
        </p>

        <dl className="mt-5 grid gap-3">
          {rows.map(({ clave: password, Icono: Icon, etiqueta: label, valor: value }) => (
            <div key={password} className="flex items-start gap-3">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} />
              <div>
                <dt className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                  {label}
                </dt>
                {/* Monoespaciada: son números que hay que reconocer luego, dígito
                    a dígito, dentro de un formulario. */}
                <dd className="font-mono text-base text-ink">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Ticket>
    </section>
  )
}

export default IdentityCard
