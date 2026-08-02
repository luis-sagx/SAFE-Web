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
}: CampoProps) {
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
        required
        className="mt-1.5 h-11 w-full rounded-md border border-hairline-strong bg-surface px-4 text-base text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      {ayuda && <p className="mt-1 text-sm text-muted">{ayuda}</p>}
    </div>
  )
}

export default Campo
