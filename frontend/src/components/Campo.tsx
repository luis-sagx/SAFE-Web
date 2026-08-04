interface CampoProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  ayuda?: string
  maxLength?: number
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  /** Mensaje de este campo. Se muestra debajo, nunca en un banner lejano. */
  error?: string
}

function Campo({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  ayuda,
  maxLength,
  inputMode,
  error,
}: CampoProps) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, ayudaId].filter(Boolean).join(' ') || undefined}
        className={`mt-1.5 h-11 w-full rounded-md border bg-surface px-4 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-1 ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-hairline-strong focus:border-ink focus:ring-ink'
        }`}
      />
      {/* El error va debajo de su campo y no en un banner al inicio del
          formulario: el usuario no técnico no relaciona un banner lejano con
          el campo que falló. */}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
      {ayuda && !error && (
        <p id={ayudaId} className="mt-1 text-sm text-muted">
          {ayuda}
        </p>
      )}
    </div>
  )
}

export default Campo
