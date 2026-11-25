import Modal from './Modal'

interface Props {
  secondsLeft: number
  onStay: () => void
}

/// Cerrarlo por cualquier vía (X, Escape, fondo) también es seguir conectado:
/// quien lo hace está frente a la pantalla.
export default function InactivityDialog({ secondsLeft, onStay }: Props) {
  return (
    <Modal titulo="¿Sigues ahí?" onClose={onStay}>
      <p className="mt-2 text-base leading-relaxed text-body">
        No hemos notado actividad. Por seguridad, tu sesión se cerrará en{' '}
        <strong className="font-semibold tabular-nums text-ink">
          {secondsLeft} {secondsLeft === 1 ? 'segundo' : 'segundos'}
        </strong>
        .
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onStay}
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition hover:bg-primary-active"
        >
          Seguir conectado
        </button>
      </div>
    </Modal>
  )
}
