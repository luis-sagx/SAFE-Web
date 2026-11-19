interface InfoRow {
  label: string
  value: string
  signal?: string
  emphasis?: boolean
}

export default function InfoRows({ items }: Readonly<{ items: InfoRow[] }>) {
  return (
    <dl className="overflow-hidden rounded-md border border-hairline bg-surface">
      {items.map((item) => (
        <div
          key={item.label}
          className={`grid grid-cols-1 gap-1 border-b border-hairline px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.5fr)] sm:items-start sm:gap-4 ${item.emphasis ? 'bg-surface-strong' : ''}`}
        >
          <dt className={`text-sm ${item.emphasis ? 'font-semibold text-ink' : 'font-medium text-body'}`}>
            {item.label}
          </dt>
          <dd
            className={`m-0 text-sm leading-relaxed ${item.emphasis ? 'font-semibold text-ink' : 'text-body'}`}
            data-signal={item.signal}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
